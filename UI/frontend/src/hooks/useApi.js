import { useEffect, useRef, useState } from "react";

export function useApi(fetcher, deps = [], immediate = true) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState("");
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const run = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetcherRef.current();
      setData(result);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || "Request failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (immediate) {
      run().catch(() => {});
    }
  }, deps);

  return { data, setData, loading, error, run };
}
