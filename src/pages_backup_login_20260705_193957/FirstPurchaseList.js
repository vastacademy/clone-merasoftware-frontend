import React, { useEffect, useState } from "react";
import SummaryApi from "../common";

const FirstPurchaseList = () => {
  const [purchaseList, setPurchaseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPurchaseList = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(SummaryApi.businessCreatedFirstPurchase.url, {
          method: SummaryApi.businessCreatedFirstPurchase.method,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch purchase list");
        }

        const data = await response.json();

        if (data.success) {
          setPurchaseList(data.data);
        } else {
          setError("Failed to load purchase list");
        }
      } catch (err) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseList();
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-6">Business Created First Purchase</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">S.No</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Customer</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Product</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Purchase Type</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Amount Paid</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Revenue Amount</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {purchaseList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="border border-gray-300 px-4 py-2 text-center">
                    No purchase records found.
                  </td>
                </tr>
              ) : (
                purchaseList.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-2">{item.customerName}</td>
                    <td className="border border-gray-300 px-4 py-2">{item.productName}</td>
                    <td className="border border-gray-300 px-4 py-2">{item.purchaseType}</td>
                    <td className="border border-gray-300 px-4 py-2">₹{item.amountPaid.toLocaleString()}</td>
                    <td className="border border-gray-300 px-4 py-2">₹{item.revenueAmount.toFixed(2)}</td>
                    <td className="border border-gray-300 px-4 py-2">{new Date(item.date).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FirstPurchaseList;
