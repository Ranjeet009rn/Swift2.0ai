import { useEffect } from 'react';

const useLockBodyScroll = (isOpen) => {
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, [isOpen]);
};

export default useLockBodyScroll;
