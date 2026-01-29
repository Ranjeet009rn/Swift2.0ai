import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { Building2, Store, MapPin, Zap } from 'lucide-react';

// Dynamic Tree Connector Component
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
                    <path d={line.path} fill="none" stroke="#a855f7" strokeWidth="4" className="opacity-20 blur-sm transition-all duration-700" />
                    <path d={line.path} fill="none" stroke="#9333ea" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500" />
                    <circle cx={line.px} cy={line.py} r="4" fill="#9333ea" />
                    <circle cx={line.cx} cy={line.cy} r="4" fill="#9333ea" />
                </React.Fragment>
            ))}
        </svg>
    );
};

// Franchise Card Component
const FranchiseCard = ({ franchise, isRoot = false, cardRef }) => {
    if (!franchise) return (
        <div ref={cardRef} className="w-40 h-40 rounded-2xl border-2 border-dashed border-purple-200 flex flex-col items-center justify-center text-purple-300 bg-purple-50/50">
            <Zap size={20} className="mb-2 opacity-20" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Available</span>
        </div>
    );

    return (
        <div ref={cardRef} className="relative group transition-all duration-500 hover:-translate-y-2 z-10">
            <div className={`w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ${isRoot ? 'ring-4 ring-purple-500/20' : ''}`}>
                <div className={`h-1.5 w-full ${isRoot ? 'bg-gradient-to-r from-purple-500 to-indigo-600' : 'bg-gradient-to-r from-purple-300 to-purple-400'}`}></div>

                <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg rotate-3 group-hover:rotate-0 transition-transform ${isRoot ? 'bg-purple-600' : 'bg-gray-800'}`}>
                            {isRoot ? <Building2 size={20} /> : <Store size={18} />}
                        </div>
                        <div className="min-w-0 text-left">
                            <h4 className="font-bold text-gray-900 text-sm truncate">{franchise.name}</h4>
                            <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold">
                                <MapPin size={10} /> {franchise.region || franchise.location || 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 border-t border-gray-50 pt-3">
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-400 font-medium uppercase tracking-tighter">Stock</span>
                            <span className="font-bold text-gray-900">{franchise.stock || 0} Units</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-400 font-medium uppercase tracking-tighter">Sales</span>
                            <span className="font-bold text-green-600">₹ {(franchise.sales || 0).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="mt-3 py-1 px-2 rounded-lg text-center text-[9px] font-black uppercase tracking-widest bg-purple-50 text-purple-600 transition-colors">
                        {franchise.type || 'Franchise'}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main Franchise Tree View Component
const FranchiseTreeView = ({ franchise }) => {
    const [loading, setLoading] = useState(true);
    const [treeData, setTreeData] = useState(null);
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
        if (!franchise) return;

        const fetchTree = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`http://localhost/mlm/backend/api/admin/franchise_tree.php?franchise_id=${franchise.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                if (data.success && data.tree) {
                    setTreeData(data.tree);
                } else {
                    // Fallback to displaying root franchise
                    setTreeData({
                        ...franchise,
                        left: null,
                        right: null
                    });
                }
            } catch (error) {
                console.error("Failed to fetch franchise tree", error);
                // Fallback on error
                setTreeData({
                    ...franchise,
                    left: null,
                    right: null
                });
            } finally {
                setLoading(false);
            }
        };
        fetchTree();
    }, [franchise]);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-20 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const displayTree = treeData || franchise;

    if (!displayTree) return null;

    return (
        <div className="space-y-6">
            {/* Tree Canvas */}
            <div className="bg-gray-50/50 rounded-[2.5rem] border border-gray-100 min-h-[900px] relative overflow-auto flex flex-col shadow-inner">
                <div className="min-w-max p-20 flex flex-col items-center flex-1 relative">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#a855f7 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                    <div ref={containerRef} className="relative pt-20 pb-40 px-32 w-full flex flex-col items-center">
                        {/* Connectors */}
                        <DynamicTreeConnector containerRef={containerRef} parentRef={refs.root} childrenRefs={[refs.l2_left, refs.l2_right]} />
                        <DynamicTreeConnector containerRef={containerRef} parentRef={refs.l2_left} childrenRefs={[refs.l3_ll, refs.l3_lr]} />
                        <DynamicTreeConnector containerRef={containerRef} parentRef={refs.l2_right} childrenRefs={[refs.l3_rl, refs.l3_rr]} />

                        {/* Level 1: Root */}
                        <div className="mb-40 z-20">
                            <FranchiseCard franchise={displayTree} isRoot={true} cardRef={refs.root} />
                        </div>

                        {/* Level 2 & 3 Layers */}
                        <div className="flex gap-80 relative z-10 px-10">
                            {/* Left Branch */}
                            <div className="flex flex-col items-center">
                                <div className="mb-40">
                                    <FranchiseCard franchise={displayTree?.left} cardRef={refs.l2_left} />
                                </div>
                                <div className="flex gap-20">
                                    <FranchiseCard franchise={displayTree?.left?.left} cardRef={refs.l3_ll} />
                                    <FranchiseCard franchise={displayTree?.left?.right} cardRef={refs.l3_lr} />
                                </div>
                            </div>

                            {/* Right Branch */}
                            <div className="flex flex-col items-center">
                                <div className="mb-40">
                                    <FranchiseCard franchise={displayTree?.right} cardRef={refs.l2_right} />
                                </div>
                                <div className="flex gap-20">
                                    <FranchiseCard franchise={displayTree?.right?.left} cardRef={refs.l3_rl} />
                                    <FranchiseCard franchise={displayTree?.right?.right} cardRef={refs.l3_rr} />
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="absolute bottom-10 left-0 flex gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white shadow-sm border border-gray-100 rounded-full">
                                <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                                <span className="text-[10px] font-bold text-gray-500">Active Franchise</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white shadow-sm border border-gray-100 rounded-full">
                                <div className="w-2 h-2 rounded-full border-2 border-dashed border-purple-300 bg-purple-50"></div>
                                <span className="text-[10px] font-bold text-gray-500">Available Slot</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FranchiseTreeView;
