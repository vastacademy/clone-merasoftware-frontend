import { useEffect, useState } from 'react';
import socket from './socket';

export default function QRModal({ show, onClose }) {
  const [qrImage, setQrImage] = useState('');
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    if (!show) return;

    // Listen for QR image
    socket.on('qr', (image) => {
      setQrImage(image);
      setStatus('awaiting_scan');
       window.dispatchEvent(new Event('trigger-qr-modal')); // ✅ Add this
    });

    // WhatsApp Ready
    socket.on('ready', () => {
      setStatus('connected');
      setTimeout(() => {
        setQrImage('');
        onClose(); // Close modal
      }, 1000); // small delay before closing
    });

    // WhatsApp Disconnected
    socket.on('disconnected', () => {
      setStatus('disconnected');
    });

    return () => {
      socket.off('qr');
      socket.off('ready');
      socket.off('disconnected');
    };
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-[350px] text-center shadow-2xl">
        <h2 className="text-xl font-semibold mb-4">Scan QR to Reconnect WhatsApp</h2>

        {status === 'connecting' && <p className="mb-4 text-gray-600">Connecting to WhatsApp...</p>}
        {status === 'awaiting_scan' && qrImage && (
          <img src={qrImage} alt="WhatsApp QR" className="w-64 h-64 mx-auto rounded" />
        )}
        {status === 'connected' && <p className="text-green-600 font-medium">Connected ✅</p>}
        {status === 'disconnected' && <p className="text-red-500 font-medium">Disconnected ❌</p>}

        <button
          onClick={onClose}
          className="mt-6 bg-gray-200 hover:bg-gray-300 text-sm px-4 py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}
