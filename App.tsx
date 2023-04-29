import React, {useState} from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Button,
  Image,
} from 'react-native';

const padding = 30;

const MovementControl = () => {
  return (
    <View style={styles.moveControlContainer}>
      <Pressable
        style={({pressed}) => [
          {
            backgroundColor: pressed ? '#9cbff7' : 'white',
            padding: padding,
          },
        ]}>
        <Image source={require('./icons/left.png')} style={styles.icon}></Image>
      </Pressable>
      <Pressable
        style={({pressed}) => [
          {
            backgroundColor: pressed ? '#9cbff7' : 'white',
            padding: padding,
          },
        ]}>
        <Image
          source={require('./icons/right.png')}
          style={styles.icon}></Image>
      </Pressable>
      <Pressable
        style={({pressed}) => [
          {
            backgroundColor: pressed ? '#9cbff7' : 'white',
            padding: padding,
          },
        ]}>
        <Image
          source={require('./icons/backward.png')}
          style={styles.icon}></Image>
      </Pressable>
      <Pressable
        style={({pressed}) => [
          {
            backgroundColor: pressed ? '#9cbff7' : 'white',
            padding: padding,
          },
        ]}>
        <Image
          source={require('./icons/forward.png')}
          style={styles.icon}></Image>
      </Pressable>
    </View>
  );
};

function App() {
  const [modal, setModal] = useState(false);

  const handleModal = () => {
    // alert('Hello world');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button
          color="#2196F3"
          title="Connect Bluetooth"
          onPress={handleModal}
        />
      </View>
      <MovementControl />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  icon: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  moveControlContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
  },
});

export default App;
