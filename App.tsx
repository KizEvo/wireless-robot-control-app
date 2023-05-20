import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  NativeModules,
  NativeEventEmitter,
  Platform,
  PermissionsAndroid,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import {SliderComponent} from './Slider';
import {useAlert} from './useAlert';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import BleManager, {
  BleScanCallbackType,
  BleScanMatchMode,
  BleScanMode,
  Peripheral,
  BleManagerDidUpdateValueForCharacteristicEvent,
} from 'react-native-ble-manager';
import Modal from './Modal';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const SECONDS_TO_SCAN_FOR = 7;
const SERVICE_UUIDS: string[] = [];
const ALLOW_DUPLICATES = true;

declare module 'react-native-ble-manager' {
  // enrich local contract with custom state properties needed by App.tsx
  interface Peripheral {
    connected?: boolean;
    connecting?: boolean;
  }
}

const CONTROL_ARROWS = [
  {
    id: 1,
    icon: require('./icons/left.png'),
    defaultValue: 192,
  },
  {
    id: 2,
    icon: require('./icons/right.png'),
    defaultValue: 128,
  },
  {
    id: 3,
    icon: require('./icons/backward.png'),
    defaultValue: 64,
  },
  {
    id: 4,
    icon: require('./icons/forward.png'),
    defaultValue: 0,
  },
];

const App = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isScanningRadar, setIsScanningRadar] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [peripherals, setPeripherals] = useState(
    new Map<Peripheral['id'], Peripheral>(),
  );
  const [pwmValue, setPWMValue] = useState(120);
  const [radarData, setRadarData] = useState<number[]>([]);

  const addOrUpdatePeripheral = (id: string, updatedPeripheral: Peripheral) => {
    // new Map() enables changing the reference & refreshing UI.
    // TOFIX not efficient.
    setPeripherals(map => new Map(map.set(id, updatedPeripheral)));
  };

  const startScan = () => {
    if (!isScanning) {
      // reset found peripherals before scan
      setPeripherals(new Map<Peripheral['id'], Peripheral>());
      setIsConnected(false);

      try {
        console.debug('[startScan] starting scan...');
        setIsScanning(true);
        BleManager.scan(SERVICE_UUIDS, SECONDS_TO_SCAN_FOR, ALLOW_DUPLICATES, {
          matchMode: BleScanMatchMode.Sticky,
          scanMode: BleScanMode.LowLatency,
          callbackType: BleScanCallbackType.AllMatches,
        })
          .then(() => {
            console.debug('[startScan] scan promise returned successfully.');
          })
          .catch(err => {
            console.error('[startScan] ble scan returned in error', err);
          });
      } catch (error) {
        console.error('[startScan] ble scan error thrown', error);
      }
    }
  };

  const handleStopScan = () => {
    setIsScanning(false);
    console.debug('[handleStopScan] scan is stopped.');
  };

  const handleDiscoverPeripheral = (peripheral: Peripheral) => {
    console.debug('[handleDiscoverPeripheral] new BLE peripheral=', peripheral);
    if (peripheral.name) {
      addOrUpdatePeripheral(peripheral.id, peripheral);
    }
  };

  const togglePeripheralConnection = async (peripheral: Peripheral) => {
    await connectPeripheral(peripheral);
  };

  const connectPeripheral = async (peripheral: Peripheral) => {
    try {
      if (peripheral) {
        addOrUpdatePeripheral(peripheral.id, {...peripheral, connecting: true});

        await BleManager.connect(peripheral.id);
        console.debug(`[connectPeripheral][${peripheral.id}] connected.`);

        addOrUpdatePeripheral(peripheral.id, {
          ...peripheral,
          connecting: false,
          connected: true,
        });

        // before retrieving services, it is often a good idea to let bonding & connection finish properly
        await sleep(900);

        /* Test read current RSSI value, retrieve services first */
        const peripheralData = await BleManager.retrieveServices(peripheral.id);
        console.debug(
          `[connectPeripheral][${peripheral.id}] retrieved peripheral services`,
          peripheralData,
        );

        const rssi = await BleManager.readRSSI(peripheral.id);
        console.debug(
          `[connectPeripheral][${peripheral.id}] retrieved current RSSI value: ${rssi}.`,
        );

        if (peripheralData.characteristics) {
          for (let characteristic of peripheralData.characteristics) {
            if (characteristic.descriptors) {
              for (let descriptor of characteristic.descriptors) {
                try {
                  let data = await BleManager.readDescriptor(
                    peripheral.id,
                    characteristic.service,
                    characteristic.characteristic,
                    descriptor.uuid,
                  );
                  console.debug(
                    `[connectPeripheral][${peripheral.id}] descriptor read as:`,
                    data,
                  );
                } catch (error) {
                  console.error(
                    `[connectPeripheral][${peripheral.id}] failed to retrieve descriptor ${descriptor} for characteristic ${characteristic}:`,
                    error,
                  );
                }
              }
            }
          }
        }

        let p = peripherals.get(peripheral.id);
        if (p) {
          addOrUpdatePeripheral(peripheral.id, {...peripheral, rssi});
        }
      }
      setIsConnected(true);
    } catch (error) {
      console.error(
        `[connectPeripheral][${peripheral.id}] connectPeripheral error`,
        error,
      );
    }
  };

  function sleep(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }

  useEffect(() => {
    try {
      BleManager.start({showAlert: false})
        .then(() => console.debug('BleManager started.'))
        .catch(error =>
          console.error('BeManager could not be started.', error),
        );
    } catch (error) {
      console.error('unexpected error starting BleManager.', error);
      return;
    }

    const listeners = [
      bleManagerEmitter.addListener(
        'BleManagerDiscoverPeripheral',
        handleDiscoverPeripheral,
      ),
      bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan),
      bleManagerEmitter.addListener(
        'BleManagerDidUpdateValueForCharacteristic',
        handleUpdateValueForCharacteristic,
      ),
    ];

    handleAndroidPermissions();

    return () => {
      console.debug('[app] main component unmounting. Removing listeners...');
      for (const listener of listeners) {
        listener.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAndroidPermissions = () => {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]).then(result => {
        if (result) {
          console.debug(
            '[handleAndroidPermissions] User accepts runtime permissions android 12+',
          );
        } else {
          console.error(
            '[handleAndroidPermissions] User refuses runtime permissions android 12+',
          );
        }
      });
    } else if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ).then(checkResult => {
        if (checkResult) {
          console.debug(
            '[handleAndroidPermissions] runtime permission Android <12 already OK',
          );
        } else {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ).then(requestResult => {
            if (requestResult) {
              console.debug(
                '[handleAndroidPermissions] User accepts runtime permission android <12',
              );
            } else {
              console.error(
                '[handleAndroidPermissions] User refuses runtime permission android <12',
              );
            }
          });
        }
      });
    }
  };

  const sendDataToPeripheral = async (item: any, isRadarMode: any) => {
    let dataToBeSent;
    let radarFlag = false;
    try {
      const connectedPeripherals = await BleManager.getConnectedPeripherals();

      if (connectedPeripherals.length === 0 || !isConnected) {
        console.debug(
          '[sendDataToPeripheral] Please connect a BLE device first',
        );
        useAlert({
          warningText: 'Please scan and connect a BLE device first',
          yesButton: 'Scan',
          callback: startScan,
        });
        return radarFlag;
      } else if (isRadarMode) {
        dataToBeSent = 52;
        radarFlag = true;
      } else {
        dataToBeSent = item.defaultValue + pwmValue / 5;
      }

      const service = 'ffe0';
      const characteristic = 'ffe1';
      const peripheralID = connectedPeripherals[0].id;

      await BleManager.retrieveServices(peripheralID);
      await BleManager.startNotification(peripheralID, service, characteristic);
      await BleManager.writeWithoutResponse(
        peripheralID,
        service,
        characteristic,
        [dataToBeSent],
      );
      console.debug(`[sendDataToPeripheral] App sent: ${[dataToBeSent]}`);
    } catch (error) {
      console.debug(
        `[sendDataToPeripheral] Error sending data to peripheral ${error}`,
      );
    }
    return radarFlag;
  };

  const startScanRadar = async () => {
    console.debug('[startScanRadar] start Radar scanning...');
    const radarFlag = await sendDataToPeripheral(null, true);
    if (radarFlag) setIsScanningRadar(true);
    else console.debug('[startScanRadar] Radar failed to scan');
    // setIsScanningRadar(true);
  };

  const handleUpdateValueForCharacteristic = (
    data: BleManagerDidUpdateValueForCharacteristicEvent,
  ) => {
    console.debug(
      `[handleUpdateValueForCharacteristic] received data from '${data.peripheral}' with characteristic='${data.characteristic}' and value='${data.value}'`,
    );
    setRadarData(data.value);
    return;
  };

  const readDataFromPeripherals = async () => {
    try {
      const connectedPeripherals = await BleManager.getConnectedPeripherals();
      const service = 'ffe0';
      const characteristic = 'ffe1';
      const peripheralID = connectedPeripherals[0].id;

      await BleManager.retrieveServices(peripheralID);
      await BleManager.startNotification(peripheralID, service, characteristic);
      await BleManager.read(peripheralID, service, characteristic);
      console.debug('[readDataFromPeripherals] Read');
    } catch (error) {
      console.log('[readDataFromPeripherals] Error occured');
    }
  };

  const RenderItem = ({item}: {item: Peripheral}) => {
    const backgroundColor = item.connected ? '#069400' : Colors.white;
    const color = backgroundColor === Colors.white ? 'black' : 'white';
    return (
      <View style={[styles.row, {backgroundColor}]}>
        <Text style={[styles.peripheralName, {color}]}>
          {item.name}
          {item.connecting && ' - Connecting...'}
        </Text>
        <Text style={[styles.peripheralId, {color}]}>{item.id}</Text>
      </View>
    );
  };

  if (isScanningRadar) {
    return (
      <>
        <StatusBar />
        <SafeAreaView>
          <Modal
            setIsScanningRadar={setIsScanningRadar}
            sendDataToPeripheral={sendDataToPeripheral}
            ultraSonicSensorData={radarData}
          />
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <StatusBar />
      <SafeAreaView style={styles.body}>
        <View style={styles.bluetoothContainer}>
          <View style={{flex: 1, flexDirection: 'row'}}>
            <Pressable style={styles.scanButton} onPress={startScan}>
              <Text style={styles.scanButtonText}>
                {isScanning ? 'Scanning...' : 'Scan Bluetooth'}
              </Text>
            </Pressable>
            <Pressable style={styles.scanButton} onPress={startScanRadar}>
              <Text style={styles.scanButtonText}>Scan Radar</Text>
            </Pressable>
          </View>
          {Array.from(peripherals.values()).length === 0 && (
            <View style={styles.row}>
              <Text style={styles.noPeripherals}>
                No Peripherals, press "Scan Bluetooth" above.
              </Text>
            </View>
          )}
          <View style={{flex: 1, flexDirection: 'row'}}>
            {Array.from(peripherals.values()).map(item => {
              return (
                <Pressable
                  onPress={() => {
                    return isConnected
                      ? useAlert({
                          warningText: 'User already connected to a device',
                          yesButton: 'Return',
                          callback: null,
                        })
                      : togglePeripheralConnection(item);
                  }}
                  key={item.id}>
                  <RenderItem item={item} />
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.mainControlContainer}>
          <View style={styles.moveControlContainer}>
            {CONTROL_ARROWS.map(item => {
              return (
                <Pressable
                  key={item.id}
                  onPress={() => sendDataToPeripheral(item, false)}
                  style={({pressed}) => [
                    {
                      backgroundColor: pressed ? '#9cbff7' : 'white',
                      borderRadius: 100,
                      borderColor: '#aeccfc',
                      borderWidth: 2,
                      padding: 20,
                    },
                  ]}>
                  <Image source={item.icon} style={styles.icon}></Image>
                </Pressable>
              );
            })}
          </View>
          <SliderComponent value={pwmValue} setValue={setPWMValue} />
        </View>
      </SafeAreaView>
    </>
  );
};

const boxShadow = {
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
};

const styles = StyleSheet.create({
  engine: {
    position: 'absolute',
    right: 10,
    bottom: 0,
    color: Colors.black,
  },
  scanButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 5,
    backgroundColor: '#0a398a',
    margin: 10,
    borderRadius: 12,
    ...boxShadow,
  },
  scanButtonText: {
    fontSize: 20,
    letterSpacing: 0.25,
    color: Colors.white,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
  peripheralName: {
    fontSize: 16,
    textAlign: 'center',
  },
  rssi: {
    fontSize: 12,
    textAlign: 'center',
    padding: 2,
  },
  peripheralId: {
    fontSize: 12,
    textAlign: 'center',
    padding: 2,
  },
  row: {
    marginLeft: 10,
    marginRight: 10,
    ...boxShadow,
  },
  noPeripherals: {
    margin: 10,
    textAlign: 'center',
    color: Colors.white,
  },
  icon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  mainControlContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moveControlContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 20,
    margin: 20,
  },
  bluetoothContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
