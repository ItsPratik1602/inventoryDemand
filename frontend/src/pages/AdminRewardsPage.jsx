import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import FormPanel from "../components/FormPanel.jsx";
import Button from "../components/Button.jsx";
import api from "../lib/api.js";

const emptyAdjustment = {
  userId: "",
  points: "",
  description: ""
};

function AdminRewardsPage() {
  const [overview, setOverview] = useState(null);
  const [rules, setRules] = useState([]);
  const [historyLookup, setHistoryLookup] = useState("");
  const [userHistory, setUserHistory] = useState(null);
  const [adjustment, setAdjustment] = useState(emptyAdjustment);
  const [loading, setLoading] = useState(true);
  const [savingRules, setSavingRules] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [error, setError] = useState("");

  const fetchRewardsAdmin = async () => {
    setLoading(true);
    setError("");

    try {
      const [overviewResponse, rulesResponse] = await Promise.all([
        api.get("/admin/rewards/overview"),
        api.get("/admin/rewards/rules")
      ]);

      setOverview(overviewResponse.data.data);
      setRules(rulesResponse.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reward dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewardsAdmin();
  }, []);

  const handleRuleChange = (actionType, field, value) => {
    setRules((current) =>
      current.map((rule) =>
        rule.actionType === actionType
          ? { ...rule, [field]: field === "points" ? value : value }
          : rule
      )
    );
  };

  const saveRules = async () => {
    setSavingRules(true);

    try {
      const payload = rules.map((rule) => ({
        actionType: rule.actionType,
        points: parseInt(rule.points, 10) || 0,
        isActive: Boolean(rule.isActive)
      }));

      const response = await api.put("/admin/rewards/rules", {
        rules: payload
      });

      setRules(response.data.data || []);
      await fetchRewardsAdmin();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save reward rules");
    } finally {
      setSavingRules(false);
    }
  };

  const submitAdjustment = async (event) => {
    event.preventDefault();
    setAdjusting(true);

    try {
      await api.post("/admin/rewards/adjust", {
        userId: parseInt(adjustment.userId, 10),
        points: parseInt(adjustment.points, 10),
        description: adjustment.description
      });

      setAdjustment(emptyAdjustment);
      await fetchRewardsAdmin();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to adjust reward points");
    } finally {
      setAdjusting(false);
    }
  };

  const lookupHistory = async () => {
    if (!historyLookup) {
      return;
    }

    try {
      const response = await api.get(`/admin/rewards/users/${historyLookup}/history`, {
        params: { page: 1, limit: 20 }
      });
      setUserHistory(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load user reward history");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rewards Control Center"
        description="Manage reward rules, ledger adjustments, and top point holders."
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <FormPanel title="Outstanding">
          <div className="text-3xl font-semibold">{loading ? "..." : overview?.totals?.totalOutstandingPoints || 0}</div>
        </FormPanel>
        <FormPanel title="Issued">
          <div className="text-3xl font-semibold">{loading ? "..." : overview?.totals?.totalPointsIssued || 0}</div>
        </FormPanel>
        <FormPanel title="Redeemed">
          <div className="text-3xl font-semibold">{loading ? "..." : overview?.totals?.totalPointsRedeemed || 0}</div>
        </FormPanel>
        <FormPanel title="Active Wallets">
          <div className="text-3xl font-semibold">{loading ? "..." : overview?.totals?.activeWallets || 0}</div>
        </FormPanel>
      </div>

      <FormPanel title="Reward Rules">
        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule.actionType} className="grid gap-3 rounded-xl border border-gray-200 p-4 md:grid-cols-[1fr_140px_120px]">
              <div>
                <div className="font-medium text-[color:var(--text)]">{rule.actionType}</div>
                <div className="text-sm text-[color:var(--muted)]">
                  {rule.actionType === "ORDER"
                    ? `Earn ${rule.points} point${rule.points !== 1 ? 's' : ''} for every ${overview?.orderSpendUnit || 100} currency units spent.`
                    : "Fixed reward points for this action."}
                </div>
              </div>
              <input
                type="number"
                value={rule.points}
                onChange={(event) => handleRuleChange(rule.actionType, "points", event.target.value)}
                className="app-input"
                min="0"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={rule.isActive}
                  onChange={(event) => handleRuleChange(rule.actionType, "isActive", event.target.checked)}
                />
                Active
              </label>
            </div>
          ))}
          <Button onClick={saveRules} loading={savingRules} variant="primary">
            Save Rules
          </Button>
        </div>
      </FormPanel>

      <div className="grid gap-6 lg:grid-cols-2">
        <FormPanel title="Manual Adjustment">
          <form onSubmit={submitAdjustment} className="space-y-4">
            <input
              type="number"
              value={adjustment.userId}
              onChange={(event) => setAdjustment((current) => ({ ...current, userId: event.target.value }))}
              className="app-input"
              placeholder="User ID"
              required
            />
            <input
              type="number"
              value={adjustment.points}
              onChange={(event) => setAdjustment((current) => ({ ...current, points: event.target.value }))}
              className="app-input"
              placeholder="Points (+/-)"
              required
            />
            <textarea
              value={adjustment.description}
              onChange={(event) => setAdjustment((current) => ({ ...current, description: event.target.value }))}
              className="app-input min-h-[96px]"
              placeholder="Reason for adjustment"
            />
            <Button type="submit" loading={adjusting} variant="primary">
              Apply Adjustment
            </Button>
          </form>
        </FormPanel>

        <FormPanel title="Lookup User History">
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="number"
                value={historyLookup}
                onChange={(event) => setHistoryLookup(event.target.value)}
                className="app-input"
                placeholder="User ID"
              />
              <Button onClick={lookupHistory} variant="secondary">
                Load
              </Button>
            </div>
            {userHistory ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="font-medium">{userHistory.user.name}</div>
                  <div className="text-sm text-[color:var(--muted)]">{userHistory.user.email}</div>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {userHistory.items.map((transaction) => (
                    <div key={transaction.id} className="rounded-xl border border-gray-200 p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>{transaction.type} · {transaction.source}</div>
                        <div className={transaction.points >= 0 ? "text-green-700 font-semibold" : "text-orange-600 font-semibold"}>
                          {transaction.points > 0 ? `+${transaction.points}` : transaction.points}
                        </div>
                      </div>
                      <div className="mt-1 text-[color:var(--muted)]">{transaction.description || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[color:var(--muted)]">Enter a user ID to inspect reward history.</p>
            )}
          </div>
        </FormPanel>
      </div>

      <FormPanel title="Top Reward Users">
        <div className="grid gap-3 md:grid-cols-2">
          {(overview?.topUsers || []).map((entry) => (
            <div key={entry.user.id} className="rounded-xl border border-gray-200 p-4">
              <div className="font-medium">{entry.user.name}</div>
              <div className="text-sm text-[color:var(--muted)]">{entry.user.email}</div>
              <div className="mt-3 text-sm">
                <div>Total Points: <strong>{entry.totalPoints}</strong></div>
                <div>Lifetime Earned: <strong>{entry.lifetimeEarned}</strong></div>
                <div>Lifetime Spent: <strong>{entry.lifetimeSpent}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </FormPanel>
    </div>
  );
}

export default AdminRewardsPage;
