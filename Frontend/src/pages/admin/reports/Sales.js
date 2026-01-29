import React from 'react';
import Layout from '../../../components/Layout';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { Download, TrendingUp } from 'lucide-react';

const SalesReport = () => {
    // Initial empty state (Real data to be fetched from API later)
    // eslint-disable-next-line no-unused-vars
    const [data, setData] = React.useState([]);

    React.useEffect(() => {
        // TODO: Fetch sales reports from API
    }, []);

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sales Report</h1>
                        <p className="text-gray-500 text-sm">Monthly sales performance and package trends</p>
                    </div>
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium flex items-center gap-2">
                        <Download size={18} /> Export PDF
                    </button>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs font-bold uppercase">Total Revenue</p>
                                <h3 className="text-2xl font-bold text-gray-900">₹ 0</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs font-bold uppercase">Packages Sold</p>
                                <h3 className="text-2xl font-bold text-gray-900">0</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px]">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue Growth</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Layout>
    );
};

export default SalesReport;
