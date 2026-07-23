import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import FormPanel from "../components/FormPanel.jsx";
import api from "../lib/api.js";
import { formatCurrency } from "../utils/currency.js";

function RewardsPage() {
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRewards = async () => {
      setLoading(true);
      setError("");

      try {
        const [balanceResponse, historyResponse] = await Promise.all([
          api.get("/rewards/balance"),
          api.get("/rewards/history", {
            params: { page: 1, limit: 20 }
          })
        ]);

        setBalance(balanceResponse.data.data);
        setHistory(historyResponse.data.data?.items || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load coins");
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  const coinValue = balance?.pointValue || 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coin Wallet"
        description="Track your coins, redemption value, and full transaction history."
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <FormPanel title="Available Coins">
          <div className="text-3xl font-semibold text-[color:var(--text)]">
            {loading ? "..." : balance?.totalPoints || 0}
          </div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Value: {formatCurrency((balance?.totalPoints || 0) * coinValue)}
          </p>
        </FormPanel>

        <FormPanel title="Lifetime Earned">
          <div className="text-3xl font-semibold text-green-700">
            {loading ? "..." : balance?.lifetimeEarned || 0}
          </div>
        </FormPanel>

        <FormPanel title="Lifetime Spent">
          <div className="text-3xl font-semibold text-orange-600">
            {loading ? "..." : balance?.lifetimeSpent || 0}
          </div>
        </FormPanel>
      </div>

      <FormPanel title="Coin Rules">
        <div className="grid gap-4 md:grid-cols-3">
          {(balance?.rules || []).map((rule) => (
            <div key={rule.actionType} className="rounded-xl border border-gray-200 p-4">
              <div className="text-sm font-medium text-[color:var(--muted)]">{rule.actionType}</div>
              <div className="mt-2 text-2xl font-semibold text-[color:var(--text)]">
                {rule.points} coins
              </div>
              <div className="mt-1 text-sm text-[color:var(--muted)]">
                {rule.isActive ? "Active" : "Inactive"}
              </div>
            </div>
          ))}
        </div>
      </FormPanel>

      <FormPanel title="Transaction History">
        {loading ? (
          <p className="text-sm text-[color:var(--muted)]">Loading coin history...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No coin activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Source</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Coins</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {history.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-4 py-3">{transaction.type}</td>
                    <td className="px-4 py-3">{transaction.source}</td>
                    <td className={`px-4 py-3 font-semibold ${transaction.points >= 0 ? "text-green-700" : "text-orange-600"}`}>
                      {transaction.points > 0 ? `+${transaction.points}` : transaction.points}
                    </td>
                    <td className="px-4 py-3">{transaction.description || "—"}</td>
                    <td className="px-4 py-3">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FormPanel>
    </div>
  );
}

export default RewardsPage;
