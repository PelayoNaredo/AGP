import { Platform } from "react-native";

let Victory =
  Platform.OS === "web" ? require("victory") : require("victory-native");

export default Victory;
