"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";

// ESP32 Bluetooth service and characteristic UUIDs
// Note: You may need to adjust these UUIDs to match your ESP32 configuration
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

interface BluetoothControllerContextType {
	isConnected: boolean;
	isConnecting: boolean;
	connectionStatus: connectionStatusStates;
	error: string | null;
	deviceName: string | null;
	connect: () => Promise<void>;
	disconnect: () => Promise<void>;
	onButtonPress: ((button: string) => void) | null;
	setOnButtonPress: (callback: ((button: string) => void) | null) => void;
}

export enum connectionStatusStates {
	DISCONNECTED,
	CONNECTING,
	CONNECTED,
	FAILED,
}
const BluetoothControllerContext = createContext<
	BluetoothControllerContextType | undefined
>(undefined);

export function BluetoothControllerProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [isConnected, setIsConnected] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);
	const [connectionStatus, setConnectionStatus] =
		useState<connectionStatusStates>(connectionStatusStates.DISCONNECTED);
	const [error, setError] = useState<string | null>(null);
	const [deviceName, setDeviceName] = useState<string | null>(null);
	const [device, setDevice] = useState<BluetoothDevice | null>(null);
	const [characteristic, setCharacteristic] =
		useState<BluetoothRemoteGATTCharacteristic | null>(null);
	const [onButtonPress, setOnButtonPress] = useState<
		((button: string) => void) | null
	>(null);

	const handleCharacteristicValueChanged = useCallback(
		(event: Event) => {
			if (!onButtonPress) return;

			const target = event.target as BluetoothRemoteGATTCharacteristic;
			const value = target.value;

			if (value) {
				// Decode the received value (assuming it's a string)
				const decoder = new TextDecoder("utf-8");
				const buttonPressed = decoder.decode(value);

				// Map the button press to game actions
				switch (buttonPressed) {
					case "LEFT":
						onButtonPress("ArrowLeft");
						break;
					case "RIGHT":
						onButtonPress("ArrowRight");
						break;
					case "UP":
						onButtonPress("ArrowUp"); // Rotate
						break;
					case "DOWN":
						onButtonPress("ArrowDown"); // Soft drop
						break;
					case "A":
						onButtonPress(" "); // Hard drop (space)
						break;
					case "B":
						onButtonPress("p"); // Pause
						break;
					default:
						console.log("Unknown button:", buttonPressed);
				}
			}
		},
		[onButtonPress],
	);

	const connect = useCallback(async () => {
		if (!navigator.bluetooth) {
			setError("Web Bluetooth API is not supported in your browser");
			return;
		}

		try {
			setIsConnecting(true);
			setConnectionStatus(connectionStatusStates.CONNECTING);
			setError(null);

			// Request device with the ESP32 service UUID
			const bluetoothDevice = await navigator.bluetooth.requestDevice({
				filters: [{ services: [SERVICE_UUID] }],
			});

			setDevice(bluetoothDevice);
			setDeviceName(bluetoothDevice.name || "ESP Controller");

			// Set up disconnect listener
			bluetoothDevice.addEventListener("gattserverdisconnected", () => {
				setIsConnected(false);
				setConnectionStatus(connectionStatusStates.DISCONNECTED);
				setCharacteristic(null);
			});

			// Connect to GATT server
			const server = await bluetoothDevice.gatt?.connect();
			if (!server) throw new Error("Failed to connect to GATT server");

			// Get the service
			const service = await server.getPrimaryService(SERVICE_UUID);
			if (!service) throw new Error("Service not found");

			// Get the characteristic
			const char = await service.getCharacteristic(CHARACTERISTIC_UUID);
			if (!char) throw new Error("Characteristic not found");

			setCharacteristic(char);
			setConnectionStatus(connectionStatusStates.CONNECTED);
			setIsConnected(true);

			// Start notifications to receive data from ESP32
			await char.startNotifications();
			char.addEventListener(
				"characteristicvaluechanged",
				handleCharacteristicValueChanged,
			);
		} catch (err) {
			console.error("Bluetooth connection error:", err);
			setError(
				err instanceof Error ? err.message : "Unknown error occurred",
			);
			setConnectionStatus(connectionStatusStates.FAILED);
		} finally {
			setIsConnecting(false);
		}
	}, [handleCharacteristicValueChanged]);

	const disconnect = useCallback(async () => {
		if (device && device.gatt?.connected) {
			if (characteristic) {
				try {
					await characteristic.stopNotifications();
					characteristic.removeEventListener(
						"characteristicvaluechanged",
						handleCharacteristicValueChanged,
					);
				} catch (err) {
					console.error("Error stopping notifications:", err);
				}
			}

			try {
				device.gatt.disconnect();
				setConnectionStatus(connectionStatusStates.DISCONNECTED);
				setIsConnected(false);
				setCharacteristic(null);
				setDeviceName(null);
			} catch (err) {
				console.error("Error disconnecting:", err);
				setError(
					err instanceof Error ? err.message : "Failed to disconnect",
				);
			}
		}
	}, [device, characteristic, handleCharacteristicValueChanged]);

	// Clean up on unmount
	useEffect(() => {
		return () => {
			if (isConnected) {
				disconnect();
			}
		};
	}, [isConnected, disconnect]);

	const value = {
		isConnected,
		isConnecting,
		connectionStatus,
		error,
		deviceName,
		connect,
		disconnect,
		onButtonPress,
		setOnButtonPress,
	};

	return (
		<BluetoothControllerContext.Provider value={value}>
			{children}
		</BluetoothControllerContext.Provider>
	);
}

export function useBluetoothController() {
	const context = useContext(BluetoothControllerContext);
	if (context === undefined) {
		throw new Error(
			"useBluetoothController must be used within a BluetoothControllerProvider",
		);
	}
	return context;
}
