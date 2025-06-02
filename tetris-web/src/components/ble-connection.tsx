"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bluetooth, BluetoothConnected, Loader2 } from "lucide-react";

interface BLEConnectionProps {
	isConnected: boolean;
	isConnecting: boolean;
	onConnect: () => void;
	onDisconnect: () => void;
}

export default function BLEConnection({
	isConnected,
	isConnecting,
	onConnect,
	onDisconnect,
}: BLEConnectionProps) {
	return (
		<Card className="bg-gray-800 border-gray-700">
			<CardHeader>
				<CardTitle className="text-white flex items-center gap-2">
					{isConnected ? (
						<BluetoothConnected className="h-5 w-5 text-blue-400" />
					) : (
						<Bluetooth className="h-5 w-5 text-gray-400" />
					)}
					ESP32 Controller
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<div className="text-sm text-gray-300">
						Status:{" "}
						{isConnected ? (
							<span className="text-green-400">Connected</span>
						) : (
							<span className="text-red-400">Disconnected</span>
						)}
					</div>

					{isConnected ? (
						<Button
							onClick={onDisconnect}
							variant="outline"
							className="w-full"
						>
							Disconnect
						</Button>
					) : (
						<Button
							onClick={onConnect}
							disabled={isConnecting}
							className="w-full"
						>
							{isConnecting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Connecting...
								</>
							) : (
								<>
									<Bluetooth className="mr-2 h-4 w-4" />
									Connect Controller
								</>
							)}
						</Button>
					)}

					<div className="text-xs text-gray-400">
						Make sure your ESP32 controller is powered on and in
						range.
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
