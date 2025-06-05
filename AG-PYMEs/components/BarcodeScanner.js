import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Button, Dimensions } from "react-native";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";

const BarcodeScanner = ({
  onCodeScanned,
  buttonTitle = "Cancelar",
  onCancel,
}) => {
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();

  useEffect(() => {
    // Resetear el estado de escaneo cuando el componente vuelve a estar en foco
    if (isFocused) {
      setScanned(false);
    }
  }, [isFocused]);

  const handleBarCodeScanned = ({ type, data }) => {
    if (!scanned) {
      setScanned(true);
      onCodeScanned({ type, data });
    }
  };

  if (!permission) {
    // Los permisos de cámara aún se están cargando
    return (
      <View style={styles.container}>
        <Text>Solicitando permiso de cámara...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Los permisos de cámara no están concedidos todavía
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>
          Necesitamos permiso para usar la cámara
        </Text>
        <Button title="Dar permiso" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: [
              "aztec",
              "codabar",
              "code39",
              "code93",
              "code128",
              "code39mod43",
              "datamatrix",
              "ean13",
              "ean8",
              "interleaved2of5",
              "itf14",
              "maxicode",
              "pdf417",
              "qr",
              "rss14",
              "rssexpanded",
              "upc_a",
              "upc_e",
              "upc_ean",
            ],
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.scanArea} />
          </View>
        </CameraView>
      )}
      <View style={styles.buttonContainer}>
        <Button title={buttonTitle} onPress={onCancel} />
      </View>
    </View>
  );
};

const { width } = Dimensions.get("window");
const scanAreaSize = width * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: scanAreaSize,
    height: scanAreaSize,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "transparent",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 30,
    width: "100%",
    alignItems: "center",
  },
});

export default BarcodeScanner;
