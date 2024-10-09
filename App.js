import { StyleSheet, Text, View,TouchableWithoutFeedback,TouchableOpacity, SafeAreaView, Image } from "react-native";
import  json  from "react/jsx-runtime";


export default function App() {  
  return (
    <SafeAreaView style={styles.container}>
      <Text> Hello React Native </Text>
      <TouchableWithoutFeedback onPress={() => console.log("Image tapped")}>
        <Image 
          source={{
            width: 200,
            height: 300,
            uri: "https://picsum.photos/200/300",
        }} />
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
});