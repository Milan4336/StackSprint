import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { Transaction } from '../../types';

interface FraudRadarMapProps {
  transactions: Transaction[];
}

const locationCoordinates: Record<string, [number, number]> = {
  NY: [40.7128, -74.006],
  CA: [36.7783, -119.4179],
  TX: [31.9686, -99.9018],
  FL: [27.6648, -81.5158],
  WA: [47.7511, -120.7401],
  London: [51.5072, -0.1276],
  Delhi: [28.6139, 77.209],
  Tokyo: [35.6762, 139.6503],
  Dubai: [25.2048, 55.2708],
  Sydney: [-33.8688, 151.2093]
};

const hashLocation = (location: string): [number, number] => {
  let hash = 0;
  for (let i = 0; i < location.length; i += 1) {
    hash = (hash << 5) - hash + location.charCodeAt(i);
    hash |= 0;
  }

  const lat = ((((hash % 140) + 140) % 140) - 70) + 0.11;
  const lng = ((((Math.floor(hash / 3) % 360) + 360) % 360) - 180) + 0.21;
  return [Math.max(-85, Math.min(85, lat)), Math.max(-180, Math.min(180, lng))];
};

const coordsForTransaction = (transaction: Transaction): [number, number] => {
  if (typeof transaction.latitude === 'number' && typeof transaction.longitude === 'number') {
    return [transaction.latitude, transaction.longitude];
  }
  return locationCoordinates[transaction.location] ?? hashLocation(transaction.location);
};

export const FraudRadarMap = ({ transactions }: FraudRadarMapProps) => {
  const points = useMemo(
    () =>
      transactions.slice(0, 140).map((transaction) => ({
        ...transaction,
        coords: coordsForTransaction(transaction)
      })),
    [transactions]
  );

  return (
    <motion.article
      className="panel"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h3 className="panel-title">Real-Time Fraud Radar World Map</h3>
      <div className="h-96 overflow-hidden rounded-xl border border-slate-700">
        <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {points.map((transaction) => {
            const fraud = transaction.isFraud || transaction.riskLevel === 'High';
            const color = fraud ? '#ef4444' : '#22c55e';

            return (
              <CircleMarker
                key={transaction.transactionId}
                center={transaction.coords}
                radius={fraud ? 10 : 7}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.65, weight: fraud ? 2 : 1 }}
                className={fraud ? 'pulse-red' : 'pulse-green'}
              >
                <Popup>
                  <div className="text-xs text-slate-900">
                    <p className="font-bold">{transaction.transactionId}</p>
                    <p>User: {transaction.userId}</p>
                    <p>Location: {transaction.location}</p>
                    <p>Amount: ${transaction.amount.toLocaleString()}</p>
                    <p>
                      Risk: {transaction.riskLevel} ({transaction.fraudScore})
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </motion.article>
  );
};
