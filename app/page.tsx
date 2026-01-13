'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [apiMessage, setApiMessage] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/hello')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch from API');
        }
        return res.json();
      })
      .then((data) => {
        setApiMessage(data.message);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setApiMessage('API not connected');
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Welcome to Mosaic
        </h1>
        <div className="text-center space-y-4">
          <p className="text-xl">
            A sandbox environment for mathematical computing and exploration
          </p>
          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-lg font-semibold mb-2">FastAPI Status:</p>
            {error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <p className="text-green-500">{apiMessage}</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
