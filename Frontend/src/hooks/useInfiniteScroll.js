import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for infinite scroll functionality
 * @param {Function} callback - Function to call when user scrolls near bottom
 * @param {boolean} hasMore - Whether there are more items to load
 * @returns {React.RefObject} - Ref to attach to the trigger element
 */
export default function useInfiniteScroll(callback, hasMore) {
  const observer = useRef();
  
  const lastElementRef = useCallback(
    (node) => {
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          callback();
        }
      }, {
        rootMargin: '200px', // Start loading 200px before the element is visible
        threshold: 0.1
      });
      
      if (node) observer.current.observe(node);
    },
    [callback, hasMore]
  );

  return lastElementRef;
}