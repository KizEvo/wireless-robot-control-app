import {Alert} from 'react-native';
export const useAlert = props => {
  return Alert.alert('Warning', props.warningText, [
    {
      text: 'Cancel',
      onPress: () => console.debug('Cancel Pressed'),
    },
    {
      text: props.yesButton,
      onPress:
        props.callback === null
          ? () => console.debug('No callback')
          : () => props.callback(),
    },
  ]);
};
