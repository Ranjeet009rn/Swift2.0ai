import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Users, TrendingUp, Award, Zap, AlertCircle } from 'lucide-react';

// --- HELPER: Map API Response to Component Tree Format ---
const mapResponseToTree = (node) => {
    if (!node) return null;

    const mapped = {
        name: node.name,
        username: node.referral_code || 'N/A',
        package: node.selected_package || 'Member',
        earnings: node.earnings || 0,
        sponsor_income: node.sponsor_income || 0,
        left_count: node.left_count || 0,
        right_count: node.right_count || 0,
        is_team_leader: node.is_team_leader || false,
    };

    if (node.children && Array.isArray(node.children)) {
        const leftNode = node.children.find(c => c.position === 'L');
        const rightNode = node.children.find(c => c.position === 'R');
        mapped.left = mapResponseToTree(leftNode);
        mapped.right = mapResponseToTree(rightNode);
    }

    return mapped;
};

// --- COMPONENTS ---
const DynamicTreeConnector = ({ parentRef, childrenRefs, containerRef }) => {
    const [lines, setLines] = useState([]);

    const updateLines = useCallback(() => {
        if (!parentRef.current || !containerRef.current || !childrenRefs || childrenRefs.length === 0) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const parentRect = parentRef.current.getBoundingClientRect();

        const parentX = parentRect.left + parentRect.width / 2 - containerRect.left;
        const parentY = parentRect.bottom - containerRect.top;

        const newLines = childrenRefs.map(childRef => {
            if (!childRef?.current) return null;
            const childRect = childRef.current.getBoundingClientRect();
            const childX = childRect.left + childRect.width / 2 - containerRect.left;
            const childY = childRect.top - containerRect.top;

            // Curve Logic
            const midY = parentY + (childY - parentY) / 2;

            return {
                path: `M ${parentX} ${parentY} L ${parentX} ${midY} L ${childX} ${midY} L ${childX} ${childY}`,
                px: parentX, py: parentY, cx: childX, cy: childY
            };
        }).filter(l => l !== null);

        setLines(newLines);
    }, [parentRef, childrenRefs, containerRef]);

    useLayoutEffect(() => {
        updateLines();

        // Retry logic to ensure layout is settled
        const timeouts = [
            setTimeout(updateLines, 50),
            setTimeout(updateLines, 150),
            setTimeout(updateLines, 300),
            setTimeout(updateLines, 500)
        ];

        window.addEventListener('resize', updateLines);
        // Observe container and all involved elements if possible
        const observer = new ResizeObserver(updateLines);
        if (containerRef.current) observer.observe(containerRef.current);
        if (parentRef.current) observer.observe(parentRef.current);
        childrenRefs.forEach(ref => {
            if (ref.current) observer.observe(ref.current);
        });

        return () => {
            timeouts.forEach(t => clearTimeout(t));
            window.removeEventListener('resize', updateLines);
            observer.disconnect();
        };
    }, [updateLines, containerRef, parentRef, childrenRefs]);

    return (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible" style={{ zIndex: 0 }}>
            {lines.map((line, i) => (
                <React.Fragment key={i}>
                    {/* Glow Path */}
                    <path
                        d={line.path}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="4"
                        className="opacity-10 blur-sm"
                    />
                    {/* Main Path */}
                    <path
                        d={line.path}
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-500"
                    />
                    {/* Anchor Points */}
                    <circle cx={line.px} cy={line.py} r="4" fill="#64748b" />
                    <circle cx={line.cx} cy={line.cy} r="4" fill="#64748b" />
                </React.Fragment>
            ))}
        </svg>
    );
};

const TreeCard = ({ member, isRoot = false, cardRef }) => {
    if (!member) return (
        <div ref={cardRef} className="w-40 h-40 rounded-2xl border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center text-indigo-300 bg-white shadow-sm hover:border-indigo-400 transition-colors">
            <Zap size={24} className="mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Empty Slot</span>
        </div>
    );

    // Convert backend Package Name to User-Friendly PV Text
    // Convert backend Package Name to User-Friendly PV Text
    const getPVText = (pkgName) => {
        if (!pkgName) return "0 PV";
        const lowerName = pkgName.toLowerCase();

        if (lowerName.includes("brownz")) return "10 PV";
        if (lowerName.includes("silver")) return "25 PV";
        if (lowerName.includes("premium")) return "25 PV";
        if (lowerName.includes("platinum")) return "40 PV";
        if (lowerName.includes("diamond")) return "50 PV";
        if (lowerName.includes("gold")) return "80 PV";

        return pkgName; // Fallback
    };

    // Assign colors based on PV value
    const getPackageColor = (pkgName) => {
        const pv = getPVText(pkgName);
        switch (pv) {
            case '10 PV': return 'from-stone-500 to-stone-700'; // Bronze/Brown
            case '25 PV': return 'from-gray-300 to-gray-500'; // Silver
            case '40 PV': return 'from-slate-700 to-slate-900'; // Platinum/Dark
            case '50 PV': return 'from-cyan-400 to-cyan-600'; // Diamond/Cyan
            case '80 PV': return 'from-yellow-400 to-yellow-600'; // Gold
            default: return 'from-indigo-500 to-indigo-700'; // Default
        }
    };

    return (
        <div ref={cardRef} className={`relative group transition-all duration-500 hover:-translate-y-2 z-10`}>
            <div className={`w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ${isRoot ? 'ring-4 ring-indigo-500/20' : ''}`}>
                <div className={`h-1.5 w-full bg-gradient-to-r ${getPackageColor(member.package)}`}></div>

                <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg rotate-3 group-hover:rotate-0 transition-transform ${isRoot ? 'bg-indigo-600' : 'bg-gray-800'}`}>
                            {member.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm truncate">{member.name}</h4>
                            <p className="text-[10px] text-gray-400 font-mono">@{member.username}</p>

                            {/* Package Badge */}
                            <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white bg-gradient-to-r ${getPackageColor(member.package)}`}>
                                {getPVText(member.package)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2 border-t border-gray-50 pt-3">
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-400 font-medium uppercase tracking-tighter">Earnings</span>
                            <span className="font-bold text-gray-900">₹ {member.earnings.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-400 font-medium uppercase tracking-tighter">Sponsor</span>
                            <span className="font-bold text-green-600">₹ {member.sponsor_income.toLocaleString()}</span>
                        </div>

                        {/* Team Size Stats */}
                        <div className="flex justify-between items-center bg-gray-50 rounded-lg p-1.5 mt-2">
                            <div className="flex flex-col items-center w-1/2 border-r border-gray-200">
                                <span className="text-[8px] font-bold text-gray-400 uppercase">Left</span>
                                <span className="text-xs font-bold text-gray-800">{member.left_count}</span>
                            </div>
                            <div className="flex flex-col items-center w-1/2">
                                <span className="text-[8px] font-bold text-gray-400 uppercase">Right</span>
                                <span className="text-xs font-bold text-gray-800">{member.right_count}</span>
                            </div>
                        </div>
                    </div>

                    {member.is_team_leader && (
                        <div className="mt-3 py-1 px-2 rounded-lg text-center text-[9px] font-black uppercase tracking-widest transition-colors bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                            Team Leader
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const UserTree = () => {
    useAuth();
    const [loading, setLoading] = useState(true);
    const [treeData, setTreeData] = useState(null);
    const [stats, setStats] = useState({ teamSize: 0, growth: 0 });
    const containerRef = useRef(null);

    // Refs for all nodes
    const refs = {
        root: useRef(null),
        l2_left: useRef(null),
        l2_right: useRef(null),
        l3_ll: useRef(null),
        l3_lr: useRef(null),
        l3_rl: useRef(null),
        l3_rr: useRef(null)
    };

    useEffect(() => {
        const fetchTree = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('http://localhost/mlm/backend/api/user/tree.php', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                console.log('Tree API Response:', data);

                if (data.success && data.tree) {
                    console.log('Raw tree data:', data.tree);
                    console.log('Children count:', data.tree.children?.length || 0);

                    const mappedTree = mapResponseToTree(data.tree);
                    console.log('Mapped tree data:', mappedTree);

                    setTreeData(mappedTree);
                    setStats({
                        teamSize: data.team_size || 0,
                        growth: data.growth_percentage || 0
                    });
                } else {
                    console.error('Tree fetch failed:', data.message);
                }
            } catch (error) {
                console.error("Failed to fetch tree", error);
            } finally {
                setLoading(false);
            }
        };

        // Initial fetch
        fetchTree();

        // Auto-refresh every 10 seconds
        const interval = setInterval(fetchTree, 10000);

        // Cleanup
        return () => clearInterval(interval);
    }, []);

    return (
        <Layout>
            <div className="space-y-10 pb-32">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Award className="text-indigo-600" size={24} />
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Global Network</span>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 leading-tight">My Binary Tree</h1>
                        <p className="text-gray-500 mt-2 max-w-md">Detailed view of your direct and indirect downline performance. Lines are anchored to centers.</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Users size={20} /></div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Team Size</p>
                                <h3 className="text-xl font-bold text-gray-900">{stats.teamSize}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-xl"><TrendingUp size={20} /></div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Growth</p>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {stats.growth >= 0 ? '+' : ''}{stats.growth}%
                                </h3>
                                {/* <h3 className="text-xl font-bold text-gray-900">+12%</h3> */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Instruction Banner */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
                    <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg shrink-0">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-yellow-900 text-sm uppercase">Payout Eligibility Rule</h4>
                        <p className="text-sm text-yellow-800 mt-1">
                            To be eligible for payouts after becoming a Team Leader, you must have at least one active direct recruit on the
                            <span className="font-bold"> LEFT</span> with a <span className="font-bold">25 PV</span> package and one on the
                            <span className="font-bold"> RIGHT</span> with a <span className="font-bold">50 PV</span> package (or vice versa).
                        </p>
                    </div>
                </div>

                <div className="bg-gray-50/50 rounded-[2.5rem] border border-gray-100 min-h-[1000px] relative overflow-hidden flex flex-col items-center shadow-inner">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-400 font-bold uppercase tracking-widest animate-pulse">Mapping Network...</p>
                        </div>
                    ) : (
                        <div ref={containerRef} className="relative pt-20 pb-40 px-10 w-full min-w-fit flex flex-col items-center">

                            {/* Connectors */}
                            <DynamicTreeConnector containerRef={containerRef} parentRef={refs.root} childrenRefs={[refs.l2_left, refs.l2_right]} />
                            <DynamicTreeConnector containerRef={containerRef} parentRef={refs.l2_left} childrenRefs={[refs.l3_ll, refs.l3_lr]} />
                            <DynamicTreeConnector containerRef={containerRef} parentRef={refs.l2_right} childrenRefs={[refs.l3_rl, refs.l3_rr]} />

                            {/* Level 1: Root */}
                            <div className="mb-40 z-20">
                                <TreeCard member={treeData} isRoot={true} cardRef={refs.root} />
                            </div>

                            {/* Level 2 & 3 */}
                            <div className="flex gap-80 relative z-10">
                                {/* Left Branch */}
                                <div className="flex flex-col items-center">
                                    <div className="mb-40">
                                        <TreeCard member={treeData?.left} cardRef={refs.l2_left} />
                                    </div>
                                    <div className="flex gap-20">
                                        <TreeCard member={treeData?.left?.left} cardRef={refs.l3_ll} />
                                        <TreeCard member={treeData?.left?.right} cardRef={refs.l3_lr} />
                                    </div>
                                </div>

                                {/* Right Branch */}
                                <div className="flex flex-col items-center">
                                    <div className="mb-40">
                                        <TreeCard member={treeData?.right} cardRef={refs.l2_right} />
                                    </div>
                                    <div className="flex gap-20">
                                        <TreeCard member={treeData?.right?.left} cardRef={refs.l3_rl} />
                                        <TreeCard member={treeData?.right?.right} cardRef={refs.l3_rr} />
                                    </div>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="absolute bottom-10 left-10 flex gap-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white shadow-sm border border-gray-100 rounded-full">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                                    <span className="text-[10px] font-bold text-gray-500">Active Network</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default UserTree;
