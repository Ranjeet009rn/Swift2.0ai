import React from 'react';
import Layout from '../../../components/Layout';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Download } from 'lucide-react';

const IncomeReport = () => {
    // Initial empty state
    // eslint-disable-next-line no-unused-vars
    const [barData, setBarData] = React.useState([]);

    React.useEffect(() => {
        // TODO: Fetch income stats
    }, []);

    const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Income Distribution</h1>
                        <p className="text-gray-500 text-sm">Breakdown of payouts by category</p>
                    </div>
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium flex items-center gap-2">
                        <Download size={18} /> Download CSV
                    </button>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[500px]">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Payout Categories</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 14 }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="amount" fill="#3b82f6" radius={[0, 10, 10, 0]} barSize={40}>
                                {barData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Layout>
    );
};

export default IncomeReport;
