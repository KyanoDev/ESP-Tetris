"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	connectionStatusStates,
	useBluetoothController,
} from "@/contexts/bluetooth-controller-context";
import { Bluetooth, BluetoothOff, Check, X } from "lucide-react";

export default function BluetoothStatus() {
	const {
		isConnected,
		isConnecting,
		connectionStatus,
		error,
		deviceName,
		connect,
		disconnect,
	} = useBluetoothController();

	const renderStatusBadge = () => {
		switch (connectionStatus) {
			case connectionStatusStates.FAILED:
				return <Badge variant={"destructive"}>ERROR</Badge>;
			case connectionStatusStates.DISCONNECTED:
				return <Badge variant={"destructive"}>DISCONNECTED</Badge>;
			case connectionStatusStates.CONNECTING:
				return <Badge variant={"secondary"}>CONNECTING</Badge>;
			case connectionStatusStates.CONNECTED:
				return <Badge>CONNECTED</Badge>;
			default:
				return <Badge variant={"secondary"}>UNKNOWN</Badge>;
		}
	};
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-bold text-white mb-2">
					Controller
				</h2>

				<div className="flex items-center gap-2 mb-3">
					{renderStatusBadge()}
				</div>
			</div>

			{error && (
				<div className="text-red-400 text-sm mb-3 flex items-center gap-1">
					<X className="h-4 w-4" />
					{error}
				</div>
			)}

			{isConnected ? (
				<div className="space-y-3">
					<div className="bg-gray-700 rounded p-2 text-sm">
						<div className="flex justify-between items-center mb-1">
							<span className="text-gray-300">Device:</span>
							<span className="text-white font-mono">
								{deviceName || "ESP Controller"}
							</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-gray-300">Status:</span>
							<span className="text-green-400 flex items-center gap-1">
								<Check className="h-3 w-3" /> Connected
							</span>
						</div>
					</div>

					<Button
						onClick={disconnect}
						variant="outline"
						className="w-full"
						disabled={isConnecting}
					>
						<BluetoothOff className="mr-2 h-4 w-4" />
						Disconnect
					</Button>
				</div>
			) : (
				<Button
					onClick={connect}
					className="w-full"
					disabled={isConnecting}
				>
					<Bluetooth className="mr-2 h-4 w-4" />
					{isConnecting ? "Connecting..." : "Connect Controller"}
				</Button>
			)}

			<div className="text-gray-300 text-sm space-y-1 mt-3">
				<p>ESP32 Controller Mapping:</p>
				<p>D-Pad: Move & Rotate</p>
				<p>A Button: Hard Drop</p>
				<p>B Button: Pause</p>
			</div>
		</div>
	);
}
