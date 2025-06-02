"use client";

import { useCallback, useEffect, useState } from "react";

export interface BLEController {
	isConnected: boolean;
	isConnecting: boolean;
	connect: () => Promise<void>;
	disconnect: () => void;
	sendGameState: (gameState: any) => void;
}

const SERVICE_UUID = "e10ae3ca-6474-445b-affa-05ea0c8ef57a";
const COMMAND_CHAR_UUID = "47c39e7f-43d8-4d16-9b99-77ad1ee4d1c3";
const STATE_CHAR_UUID = "e4f49389-330b-4e8f-a771-a8056fb6367a";

export function useBLEController(
	onCommand: (command: string) => void,
): BLEController {
	const [device, setDevice] = useState<BluetoothDevice | null>(null);
	const [server, setServer] = useState<BluetoothRemoteGATTServer | null>(
		null,
	);
	const [commandCharacteristic, setCommandCharacteristic] =
		useState<BluetoothRemoteGATTCharacteristic | null>(null);
	const [stateCharacteristic, setStateCharacteristic] =
		useState<BluetoothRemoteGATTCharacteristic | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);

	const handleDisconnection = useCallback(() => {
		console.log("BLE device disconnected");
		setIsConnected(false);
		setDevice(null);
		setServer(null);
		setCommandCharacteristic(null);
		setStateCharacteristic(null);
	}, []);

	const connect = useCallback(async () => {
		if (!navigator.bluetooth) {
			alert("Web Bluetooth is not supported in this browser!");
			return;
		}

		try {
			setIsConnecting(true);

			// Request device
			const device = await navigator.bluetooth.requestDevice({
				filters: [{ name: "ESP32-Tetris-Controller" }],
				optionalServices: [SERVICE_UUID],
			});

			console.log("Connecting to device:", device.name);

			// Add disconnect listener
			device.addEventListener(
				"gattserverdisconnected",
				handleDisconnection,
			);

			// Connect to GATT server
			const server = await device.gatt!.connect();
			console.log("Connected to GATT server");

			// Get service
			const service = await server.getPrimaryService(SERVICE_UUID);
			console.log("Got service");

			// Get characteristics
			const commandChar =
				await service.getCharacteristic(COMMAND_CHAR_UUID);
			const stateChar = await service.getCharacteristic(STATE_CHAR_UUID);

			// Start notifications for command characteristic
			await commandChar.startNotifications();
			commandChar.addEventListener(
				"characteristicvaluechanged",
				(event) => {
					const target =
						event.target as BluetoothRemoteGATTCharacteristic;
					const value = new TextDecoder().decode(target.value!);

					try {
						const data = JSON.parse(value);
						if (data.type === "gameCommand") {
							console.log("Received command:", data.command);
							onCommand(data.command);
						}
					} catch (error) {
						console.error("Error parsing BLE message:", error);
					}
				},
			);

			setDevice(device);
			setServer(server);
			setCommandCharacteristic(commandChar);
			setStateCharacteristic(stateChar);
			setIsConnected(true);

			console.log("BLE connection established");
		} catch (error) {
			console.error("BLE connection failed:", error);
			alert("Failed to connect to ESP32 controller");
		} finally {
			setIsConnecting(false);
		}
	}, [onCommand, handleDisconnection]);

	const disconnect = useCallback(() => {
		if (device && device.gatt?.connected) {
			device.gatt.disconnect();
		}
		handleDisconnection();
	}, [device, handleDisconnection]);

	const sendGameState = useCallback(
		async (gameState: any) => {
			if (!stateCharacteristic || !isConnected) return;

			try {
				const message = JSON.stringify({
					type: "gameState",
					...gameState,
				});

				const encoder = new TextEncoder();
				await stateCharacteristic.writeValue(encoder.encode(message));
			} catch (error) {
				console.error("Error sending game state:", error);
			}
		},
		[stateCharacteristic, isConnected],
	);

	// Cleanup on unmount
	useEffect(() => {
		console.log("EFFECT RUN");
	}, []);

	return {
		isConnected,
		isConnecting,
		connect,
		disconnect,
		sendGameState,
	};
}
