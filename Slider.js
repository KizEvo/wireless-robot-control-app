import {useState} from 'react';
import {Slider} from '@miblanchard/react-native-slider';
import {StyleSheet, View, Text} from 'react-native';
import {useDebounce} from './useDebounce';

export const SliderComponent = props => {
  return (
    <View style={styles.container}>
      <Text>PWM Speed: {props.value}</Text>
      <Slider
        value={props.value}
        onValueChange={value => props.setValue(value)}
        maximumValue={255}
        minimumValue={0}
        minimumTrackTintColor="#307ecc"
        maximumTrackTintColor="#d3d3d3"
        thumbTintColor="#0260ed"
        step={5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '25%',
    marginLeft: 10,
    marginRight: 10,
  },
});
