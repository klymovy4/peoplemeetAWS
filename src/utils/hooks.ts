import { useState, useEffect } from 'react';

const useHeaderHeight = (): number => {
    const [headerHeight, setHeaderHeight] = useState<number>(0);

    useEffect(() => {
        const updateHeight = () => {
            const header = document.getElementById('header');
            if (header) {
                setHeaderHeight(header.offsetHeight);
            }
        };

        updateHeight();

        window.addEventListener('resize', updateHeight);
        return () => {
            window.removeEventListener('resize', updateHeight);
        };
    }, []);

    return headerHeight + 2;
};

export default useHeaderHeight;
