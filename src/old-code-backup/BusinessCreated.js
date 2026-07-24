import React, { useEffect, useState } from "react";
import SummaryApi from '../common';

const BusinessCreated = () => {
  const [businessData, setBusinessData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(SummaryApi.businessCreatedToPartner.url, {
          credentials: "include",
        });
        const data = await response.json();
        if (data.success) {
          setBusinessData(data.data);
        } else {
          setError(data.message || "Failed to fetch business data");
        }
      } catch (err) {
        setError(err.message || "Failed to fetch business data");
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, []);

  return (
    <div className="p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Business created</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">Error: {error}</p>
      ) : businessData.length === 0 ? (
        <p>No business data found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">S.No</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Revenue Amount (%)</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Paid Amount</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Payment Type</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {businessData.map((item) => (
                <tr key={item.serialNo}>
                  <td className="border border-gray-300 px-4 py-2">{item.serialNo}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.revenueAmount}</td>
                  <td className="border border-gray-300 px-4 py-2">₹{item.paidAmount.toLocaleString()}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.paymentType}</td>
                  <td className="border border-gray-300 px-4 py-2">{new Date(item.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BusinessCreated;
