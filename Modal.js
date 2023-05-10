import {Text, View, StyleSheet, Pressable, Animated} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {useRef} from 'react';

const lineProportionalFirstLeft = 66;
const lineProportionalSecondLeft = 132;

const DEFAULT_DEGREE_VALUE = [
  {id: 1, value: 30},
  {id: 2, value: 60},
  {id: 3, value: 90},
  {id: 4, value: 120},
  {id: 5, value: 150},
];

const DEFAULT_LINE_DEGREE_VALUE = [
  {
    id: 1,
    top: -75,
    left: -25,
    rotate: '135deg',
  },
  {
    id: 2,
    top: -30,
    left: -2,
    rotate: '165deg',
  },
  {
    id: 3,
    top: 20,
    left: -3,
    rotate: '195deg',
  },
  {
    id: 4,
    top: 63,
    left: -27,
    rotate: '225deg',
  },
  {
    id: 5,
    top: 88,
    left: -68,
    rotate: '255deg',
  },
];

const DEFAULT_SHOW_SCANNED_OBJECT_POSITION = [
  {id: 1, top: 20},
  {id: 2, top: 90},
  {id: 3, top: 150},
];

const Modal = props => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const scanAnimation = () => {
    // Will change fadeAnim value to 1 in 5 seconds
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
      {
        iterations: 4,
      },
    ).start();
    console.debug(
      '[scanAnimation] Scan animation started, repeating animation 4 times',
    );
    props.sendDataToPeripheral(null, true);
  };

  const handleDegValuePlacement = value => {
    const position = {
      top: 0,
      left: 0,
    };

    switch (value) {
      case 30:
        position.top = 60;
        position.left = 10;
        break;
      case 60:
        position.left = 90;
        break;
      case 90:
        position.top = -25;
        position.left = 187;
        break;
      case 120:
        position.left = 290;
        break;
      case 150:
        position.top = 60;
        position.left = 365;
        break;
    }

    return position;
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View
          style={{
            marginTop: 20,
            padding: 100,
            paddingHorizontal: 200,
            backgroundColor: '#0e4c25',
            borderTopLeftRadius: 200,
            borderTopRightRadius: 200,
          }}>
          <View style={[styles.arcLeft, {zIndex: 3}]}>
            {DEFAULT_LINE_DEGREE_VALUE.map(line => {
              const {top, left, rotate, id} = line;
              return (
                <View
                  key={id}
                  style={[styles.lineDeg, {top, left, transform: [{rotate}]}]}>
                  <View
                    style={[
                      styles.lineProportional,
                      {left: lineProportionalFirstLeft},
                    ]}
                  />
                  <View
                    style={[
                      styles.lineProportional,
                      {left: lineProportionalSecondLeft},
                    ]}
                  />
                  <View
                    style={{
                      position: 'absolute',
                      backgroundColor: '#5ebc65',
                      borderColor: '#51995a',
                      borderWidth: 2,
                      padding: 5,
                      borderRadius: 100,
                      top: -6,
                      left: 20,
                      zIndex: 2,
                    }}
                  />
                </View>
              );
            })}
          </View>
          <View style={styles.arcRight} />
          {DEFAULT_DEGREE_VALUE.map(deg => {
            const {top, left} = handleDegValuePlacement(deg.value);
            return (
              <View key={deg.id} style={{position: 'absolute', top, left}}>
                <Text
                  style={{color: '#529b3a', fontWeight: '700', fontSize: 20}}>
                  {deg.value}
                </Text>
              </View>
            );
          })}
          <View
            style={{
              position: 'absolute',
              backgroundColor: '#c8facc',
              padding: 10,
              borderRadius: 100,
              top: 185,
              left: 191,
              zIndex: 3,
            }}
          />
          <Animated.View
            style={{
              position: 'absolute',
              marginTop: 20,
              padding: 100,
              top: -20,
              paddingHorizontal: 200,
              backgroundColor: '#266f37',
              borderTopLeftRadius: 200,
              borderTopRightRadius: 200,
              opacity: fadeAnim,
            }}
          />
        </View>

        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Pressable
            style={styles.scanButton}
            onPress={() => props.setIsScanningRadar(false)}>
            <Text style={styles.scanButtonText}>Return</Text>
          </Pressable>
          <Pressable style={styles.scanButton} onPress={scanAnimation}>
            <Text style={styles.scanButtonText}>Scan</Text>
          </Pressable>
        </View>
      </View>
    </View>
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
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  lineProportional: {
    position: 'absolute',
    backgroundColor: 'orange',
    padding: 1,
    paddingVertical: 6,
    top: -5,
  },
  lineDeg: {
    position: 'absolute',
    backgroundColor: '#c8facc',
    padding: 1,
    paddingHorizontal: 100,
  },
  arcLeft: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderRightWidth: 200,
    borderTopWidth: 200,
    borderTopColor: 'black',
    borderRightColor: 'transparent',
    transform: [{rotate: '255deg'}],
    top: 29,
    left: -16,
  },
  arcRight: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderRightWidth: 200,
    borderTopWidth: 200,
    borderRightColor: 'transparent',
    borderTopColor: 'black',
    transform: [{rotate: '195deg'}],
    top: 29,
    left: 216,
    zIndex: 2,
  },
  container: {
    height: '100%',
    padding: 20,
    color: Colors.black,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
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
});

export default Modal;
