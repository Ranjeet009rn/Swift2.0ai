import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { User, Zap } from 'lucide-react';

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
                    <path d={line.path} fill="none" stroke="#3b82f6" strokeWidth="4" className="opacity-20 blur-sm transition-all duration-700" />
                    <path d={line.path} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500" />
                    <circle cx={line.px} cy={line.py} r="4" fill="#2563eb" />
                    <circle cx={line.cx} cy={line.cy} r="4" fill="#2563eb" />
                </React.Fragment>
            ))}
        </svg>
    );
};

// Available Node Card
const AvailableNodeCard = ({ cardRef }) => {
    return (
        <div ref={cardRef} className="w-48 h-32 rounded-2xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-blue-400 bg-blue-50/50 hover:bg-blue-100/50 hover:border-blue-300 transition-all cursor-pointer group z-10 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors">
                <Zap size={24} className="text-blue-500" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Available Slot</span>
        </div>
    );
};

// User Card Component
const UserCard = ({ user, isRoot = false, cardRef }) => {
    return (
        <div ref={cardRef} className="relative group transition-all duration-500 hover:-translate-y-2 z-10">
            <div className={`w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ${isRoot ? 'ring-4 ring-blue-500/30 shadow-blue-200' : ''}`}>
                <div className={`h-2 w-full ${isRoot ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-blue-300 to-blue-400'}`}></div>

                <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg rotate-3 group-hover:rotate-0 transition-transform ${isRoot ? 'bg-gradient-to-br from-blue-600 to-indigo-600' : 'bg-gradient-to-br from-gray-700 to-gray-900'}`}>
                            {user.avatar || user.name?.charAt(0) || <User size={24} />}
                        </div>
                        <div className="min-w-0 text-left flex-1">
                            <h4 className="font-bold text-gray-900 text-sm truncate">{user.name || 'Unknown'}</h4>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold mt-0.5">
                                ID: {user.user_id || user.id}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 border-t border-gray-50 pt-3">
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-400 font-medium uppercase tracking-tight">Rank</span>
                            <span className="font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded">{user.rank || 'None'}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-400 font-medium uppercase tracking-tight">Status</span>
                            <span className={`font-bold px-2 py-0.5 rounded ${user.status === 'Active' || user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {user.status || 'Inactive'}
                            </span>
                        </div>
                    </div>

                    {isRoot && (
                        <div className="mt-3 py-1.5 px-3 rounded-lg text-center text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">
                            Team Leader
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Main User Tree View Component - BINARY TREE ONLY
const UserTreeView = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [treeData, setTreeData] = useState(null);
    const containerRef = useRef(null);

    // Node refs for binary tree (3 levels)
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
        if (!user) return;

        const fetchTree = async () => {
            try {
                const token = localStorage.getItem('authToken');
                // Always fetch as binary tree
                const response = await fetch(`http://localhost/mlm/backend/api/admin/user_tree.php?user_id=${user.id}&type=binary`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                console.log('Admin Tree API Response:', data);
                console.log('User ID:', user.id);

                if (data.success && data.tree) {
                    console.log('Tree data received:', data.tree);
                    console.log('Has left child:', !!data.tree.left);
                    console.log('Has right child:', !!data.tree.right);
                    console.log('Left child data:', data.tree.left);
                    console.log('Right child data:', data.tree.right);
                    console.log('Full tree structure:', JSON.stringify(data.tree, null, 2));
                    setTreeData(data.tree);
                } else {
                    console.warn('No tree data, using fallback:', data.message);
                    // Fallback to displaying the root user with no connections if fetch fails or no tree
                    setTreeData({
                        ...user,
                        left: null,
                        right: null
                    });
                }
            } catch (error) {
                console.error("Failed to fetch user tree", error);
                // Fallback on error
                setTreeData({
                    ...user,
                    left: null,
                    right: null
                });
            } finally {
                setLoading(false);
            }
        };

        // Initial fetch
        fetchTree();

        // Auto-refresh every 10 seconds for real-time updates
        const interval = setInterval(fetchTree, 10000);

        // Cleanup on unmount
        return () => clearInterval(interval);
    }, [user]);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-20 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-blue-600 font-semibold animate-pulse">Loading Team Network...</p>
                </div>
            </div>
        );
    }

    // Safety check - if absolutely no data (should not happen with fallback)
    const displayUser = treeData || user;

    console.log('RENDER - displayUser:', displayUser);
    console.log('RENDER - displayUser.left:', displayUser?.left);
    console.log('RENDER - displayUser.right:', displayUser?.right);

    if (!displayUser) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center">
                <p>Error loading user data.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <User size={20} className="text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-blue-900 text-sm">Binary Team Structure</h3>
                    <p className="text-blue-700 text-xs mt-0.5">Showing {displayUser.name}'s team. Max 2 direct referrals per member.</p>
                </div>
            </div>

            {/* Tree Canvas */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-[2.5rem] border border-gray-200 min-h-[900px] relative overflow-auto flex flex-col shadow-inner">
                <div className="min-w-max p-20 flex flex-col items-center flex-1 relative">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}></div>

                    <div ref={containerRef} className="relative pt-20 pb-40 px-32 w-full flex flex-col items-center">
                        {/* Connectors */}
                        <DynamicTreeConnector containerRef={containerRef} parentRef={refs.root} childrenRefs={[refs.l2_left, refs.l2_right]} />
                        <DynamicTreeConnector containerRef={containerRef} parentRef={refs.l2_left} childrenRefs={[refs.l3_ll, refs.l3_lr]} />
                        <DynamicTreeConnector containerRef={containerRef} parentRef={refs.l2_right} childrenRefs={[refs.l3_rl, refs.l3_rr]} />

                        {/* Level 1: Root (Team Leader) */}
                        <div className="mb-40 z-20">
                            <UserCard user={displayUser} isRoot={true} cardRef={refs.root} />
                        </div>

                        {/* Level 2 & 3 Layers - Binary Tree */}
                        <div className="flex gap-80 relative z-10 px-10">
                            {/* Left Branch */}
                            <div className="flex flex-col items-center">
                                <div className="mb-40">
                                    {displayUser?.left ? (
                                        <UserCard user={displayUser.left} cardRef={refs.l2_left} />
                                    ) : (
                                        <AvailableNodeCard cardRef={refs.l2_left} />
                                    )}
                                </div>
                                <div className="flex gap-20">
                                    {displayUser?.left?.left ? (
                                        <UserCard user={displayUser.left.left} cardRef={refs.l3_ll} />
                                    ) : (
                                        <AvailableNodeCard cardRef={refs.l3_ll} />
                                    )}
                                    {displayUser?.left?.right ? (
                                        <UserCard user={displayUser.left.right} cardRef={refs.l3_lr} />
                                    ) : (
                                        <AvailableNodeCard cardRef={refs.l3_lr} />
                                    )}
                                </div>
                            </div>

                            {/* Right Branch */}
                            <div className="flex flex-col items-center">
                                <div className="mb-40">
                                    {displayUser?.right ? (
                                        <UserCard user={displayUser.right} cardRef={refs.l2_right} />
                                    ) : (
                                        <AvailableNodeCard cardRef={refs.l2_right} />
                                    )}
                                </div>
                                <div className="flex gap-20">
                                    {displayUser?.right?.left ? (
                                        <UserCard user={displayUser.right.left} cardRef={refs.l3_rl} />
                                    ) : (
                                        <AvailableNodeCard cardRef={refs.l3_rl} />
                                    )}
                                    {displayUser?.right?.right ? (
                                        <UserCard user={displayUser.right.right} cardRef={refs.l3_rr} />
                                    ) : (
                                        <AvailableNodeCard cardRef={refs.l3_rr} />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="absolute bottom-10 left-10 flex gap-4">
                            <div className="flex items-center gap-2 px-3 py-2 bg-white shadow-md border border-gray-200 rounded-xl">
                                <div className="w-3 h-3 rounded-full bg-blue-600 shadow-lg"></div>
                                <span className="text-xs font-bold text-gray-700">Active Member</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 bg-white shadow-md border border-gray-200 rounded-xl">
                                <div className="w-3 h-3 rounded-full border-2 border-dashed border-blue-400 bg-blue-50"></div>
                                <span className="text-xs font-bold text-gray-700">Available Slot</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserTreeView;
