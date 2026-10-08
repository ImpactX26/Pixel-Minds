import { useState, useCallback } from 'react';

export function useApi(apiFunction) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  const isEmpty = data === null || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0);

  return {
    data,
    loading,
    error,
    isEmpty,
    execute,
    setData, // In case we want to update it locally (e.g. from websocket)
  };
}

export default useApi;

