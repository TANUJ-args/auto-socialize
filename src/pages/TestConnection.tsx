import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function TestConnectionPage() {
  const [results, setResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (name: string, success: boolean, data?: any, error?: any) => {
    setResults(prev => [...prev, { name, success, data, error, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    // Test 1: Health endpoint
    try {
      const res = await fetch('http://localhost:5000/health');
      const data = await res.json();
      addResult('Backend Health', true, data);
    } catch (e: any) {
      addResult('Backend Health', false, null, e.message);
    }

    // Test 2: Instagram health endpoint
    try {
      const res = await fetch('http://localhost:5000/api/instagram/health');
      const data = await res.json();
      addResult('Instagram Routes Health', true, data);
    } catch (e: any) {
      addResult('Instagram Routes Health', false, null, e.message);
    }

    // Test 3: Auth check
    try {
      const data = await api.auth.getCurrentUser();
      addResult('Auth Check', true, data);
    } catch (e: any) {
      addResult('Auth Check', false, null, e.message);
    }

    // Test 4: Demo token validation
    try {
      const data = await api.request('/api/instagram/validate-token', {
        method: 'POST',
        body: JSON.stringify({ accessToken: 'DEMO_TOKEN_FOR_TESTING' })
      });
      addResult('Demo Token Validation', true, data);
    } catch (e: any) {
      addResult('Demo Token Validation', false, null, e.message);
    }

    setTesting(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Connection Test</h1>
        <Button onClick={runTests} disabled={testing}>
          {testing ? 'Testing...' : 'Run Connection Tests'}
        </Button>
      </Card>

      {results.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Test Results</h2>
          <div className="space-y-3">
            {results.map((result, i) => (
              <div key={i} className={`p-3 rounded border-l-4 ${result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{result.name}</span>
                  <span className="text-sm text-gray-500">{result.timestamp}</span>
                </div>
                {result.success ? (
                  <div className="text-sm text-green-700 mt-1">
                    ✅ Success
                    {result.data && (
                      <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-red-700 mt-1">
                    ❌ Failed: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}