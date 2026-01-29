import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Building2, Store, ShoppingCart, Activity, MapPin, Zap } from 'lucide-react';

// --- FRANCHISE DEMO DATA ---
// --- HELPER: Map API Response to Tree Format ---
const mapResponseToTree = (node) => {
    if (!node) return null;

    const mapped = {
        name: node.franchise_name || 'Unnamed',
        location: node.city || 'Unknown',
        username: node.franchise_code || 'N/A',
        type: node.franchise_type || 'Unit',
        sales: 0, // Placeholder
        commission: 0,
    };

    if (node.children && Array.isArray(node.children)) {
        // Map first child to left, second to right (Visual only adaptation)
        if (node.children[0]) mapped.left = mapResponseToTree(node.children[0]);
        if (node.children[1]) mapped.right = mapResponseToTree(node.children[1]);
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

        const timeouts = [
            setTimeout(updateLines, 50),
            setTimeout(updateLines, 150),
            setTimeout(updateLines, 300),
            setTimeout(updateLines, 500)
        ];

        window.addEventListener('resize', updateLines);

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
                    <path d={line.path} fill="none" stroke="#f97316" strokeWidth="4" className="opacity-20 blur-sm transition-all duration-700" />
                    <path d={line.path} fill="none" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500" />
                    <circle cx={line.px} cy={line.py} r="4" fill="#ea580c" />
                    <circle cx={line.cx} cy={line.cy} r="4" fill="#ea580c" />
                </React.Fragment>
            ))}
        </svg>
    );
};

const FranchiseCard = ({ hub, isRoot = false, cardRef }) => {
    if (!hub) return (
        <div ref={cardRef} className="w-40 h-40 rounded-2xl border-2 border-dashed border-orange-200 flex flex-col items-center justify-center text-orange-300 bg-orange-50/50">
            <Zap size={20} className="mb-2 opacity-20" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Available</span>
        </div>
    );

    const getTypeColor = (type) => {
        if (type.includes('Master')) return 'from-orange-500 to-red-600 text-white';
        if (type.includes('Regional')) return 'from-amber-400 to-orange-500 text-white';
        return 'from-orange-300 to-orange-400 text-white';
    };

    return (
        <div ref={cardRef} className="relative group transition-all duration-500 hover:-translate-y-2 z-10">
            <div className={`w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ${isRoot ? 'ring-4 ring-orange-500/20' : ''}`}>
                <div className={`h-1.5 w-full bg-gradient-to-r ${getTypeColor(hub.type)}`}></div>

                <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg rotate-3 group-hover:rotate-0 transition-transform ${isRoot ? 'bg-orange-600' : 'bg-gray-800'}`}>
                            {isRoot ? <Building2 size={20} /> : <Store size={18} />}
                        </div>
                        <div className="min-w-0 text-left">
                            <h4 className="font-bold text-gray-900 text-sm truncate">{hub.name}</h4>
                            <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold">
                                <MapPin size={10} /> {hub.location}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 border-t border-gray-50 pt-3">
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-400 font-medium uppercase tracking-tighter">Sales Vol.</span>
                            <span className="font-bold text-gray-900">₹ {(hub.sales / 1000).toLocaleString()}k</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-400 font-medium uppercase tracking-tighter">Comm.</span>
                            <span className="font-bold text-green-600">₹ {hub.commission.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="mt-3 py-1 px-2 rounded-lg text-center text-[9px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 transition-colors">
                        {hub.type}
                    </div>
                </div>
            </div>
        </div>
    );
};

const FranchiseTree = () => {
    useAuth();
    const [loading, setLoading] = useState(true);
    const [treeData, setTreeData] = useState(null);
    const [stats, setStats] = useState({ active_units: 0, total_sales: 0 });
    const containerRef = useRef(null);

    // Node refs
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
                const response = await fetch('http://localhost/mlm/backend/api/franchise/tree.php', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success && data.tree) {
                    setTreeData(mapResponseToTree(data.tree));
                    if (data.stats) {
                        setStats(data.stats);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch franchise tree", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTree();
    }, []);

    return (
        <Layout>
            <div className="space-y-10 pb-32">
                {/* Header Info - Same as UserTree style */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 text-left">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="text-orange-600" size={24} />
                            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Franchise Network</span>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 leading-tight">Team Distribution</h1>
                        <p className="text-gray-500 mt-2 max-w-md">Detailed view of your franchise units and regional centers performance. Use the zoom/pan tool to explore.</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Activity size={20} /></div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Active Units</p>
                                <h3 className="text-xl font-bold text-gray-900">{stats.active_units}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-xl"><ShoppingCart size={20} /></div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Sales</p>
                                <h3 className="text-xl font-bold text-gray-900">₹ {parseFloat(stats.total_sales).toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tree View Canvas - Adjusted to fix the "half out of box" issue */}
                <div className="bg-gray-50/50 rounded-[2.5rem] border border-gray-100 min-h-[900px] relative overflow-auto flex flex-col shadow-inner">
                    {/* Centering Wrapper: Important for fixing clipping on small screens */}
                    <div className="min-w-max p-20 flex flex-col items-center flex-1 relative">
                        {/* Background Grid Pattern */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#f97316 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                        {loading ? (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="mt-4 text-orange-400 font-bold uppercase tracking-widest animate-pulse">Syncing Hubs...</p>
                            </div>
                        ) : (
                            <div ref={containerRef} className="relative pt-20 pb-40 px-32 w-full flex flex-col items-center">

                                {/* Connectors */}
                                <DynamicTreeConnector containerRef={containerRef} parentRef={refs.root} childrenRefs={[refs.l2_left, refs.l2_right]} />
                                <DynamicTreeConnector containerRef={containerRef} parentRef={refs.l2_left} childrenRefs={[refs.l3_ll, refs.l3_lr]} />
                                <DynamicTreeConnector containerRef={containerRef} parentRef={refs.l2_right} childrenRefs={[refs.l3_rl, refs.l3_rr]} />

                                {/* Level 1: Root */}
                                <div className="mb-40 z-20">
                                    <FranchiseCard hub={treeData} isRoot={true} cardRef={refs.root} />
                                </div>

                                {/* Level 2 & 3 Layers - Matches UserTree spacing */}
                                <div className="flex gap-80 relative z-10 px-10">
                                    {/* Left Branch */}
                                    <div className="flex flex-col items-center">
                                        <div className="mb-40">
                                            <FranchiseCard hub={treeData?.left} cardRef={refs.l2_left} />
                                        </div>
                                        <div className="flex gap-20">
                                            <FranchiseCard hub={treeData?.left?.left} cardRef={refs.l3_ll} />
                                            <FranchiseCard hub={treeData?.left?.right} cardRef={refs.l3_lr} />
                                        </div>
                                    </div>

                                    {/* Right Branch */}
                                    <div className="flex flex-col items-center">
                                        <div className="mb-40">
                                            <FranchiseCard hub={treeData?.right} cardRef={refs.l2_right} />
                                        </div>
                                        <div className="flex gap-20">
                                            <FranchiseCard hub={treeData?.right?.left} cardRef={refs.l3_rl} />
                                            <FranchiseCard hub={treeData?.right?.right} cardRef={refs.l3_rr} />
                                        </div>
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="absolute bottom-10 left-0 flex gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white shadow-sm border border-gray-100 rounded-full">
                                        <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
                                        <span className="text-[10px] font-bold text-gray-500">Active Hub</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default FranchiseTree;
