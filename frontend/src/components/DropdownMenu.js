'use client';

import { useState, useRef, useEffect } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

export default function DropdownMenu({ options, items, trigger, onOptionClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Support both 'items' and 'options' props for backward compatibility
  const menuItems = items || options || [];

  // Update position dynamically - untuk position: fixed gunakan rect langsung tanpa scrollY/scrollX
  const updatePosition = () => {
    if (triggerRef.current && dropdownRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = 192; // w-48 = 192px
      const dropdownHeight = dropdownRef.current.offsetHeight || 300; // Estimasi tinggi dropdown
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Tentukan apakah dropdown harus muncul di atas atau di bawah
      let top;
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        // Tidak cukup ruang di bawah, tapi ada lebih banyak ruang di atas
        top = rect.top - dropdownHeight - 4; // Tampilkan di ATAS tombol
      } else {
        // Cukup ruang di bawah, atau lebih baik di bawah
        top = rect.bottom + 4; // Tampilkan di BAWAH tombol
      }

      setPosition({
        top: top,
        left: rect.right - dropdownWidth // Align ke kanan trigger button
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updatePosition();
      }
    };

    if (isOpen) {
      updatePosition(); // Update position immediately when opened

      // Update position lagi setelah dropdown ter-render (untuk mendapatkan tinggi yang akurat)
      requestAnimationFrame(() => {
        updatePosition();
      });

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('scroll', handleScroll, true); // Capture phase untuk semua scroll events
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const handleOptionClick = (option) => {
    console.log('🎯 DropdownMenu: Option clicked:', option.label);
    setIsOpen(false);

    // Support both direct onClick from item and parent onOptionClick callback
    if (option.onClick) {
      console.log('🎯 DropdownMenu: Calling option.onClick callback');
      option.onClick();
    } else if (onOptionClick) {
      console.log('🎯 DropdownMenu: Calling onOptionClick callback');
      onOptionClick(option);
    } else {
      console.error('❌ DropdownMenu: No onClick callback defined!');
    }
  };

  const handleTriggerClick = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    // Position akan di-update otomatis oleh useEffect
  };

  return (
    <div className="relative">
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
      >
        {trigger || (
          <button
            className="p-2 md:p-1.5 rounded-full hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="More options"
          >
            <EllipsisVerticalIcon className="h-5 w-5 text-white" />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed z-[100] w-48 bg-white rounded-md shadow-xl border border-gray-200 py-1 max-h-[80vh] overflow-y-auto"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`
          }}
        >
          {menuItems.map((option, index) => {
            const IconComponent = option.icon;
            return (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                disabled={option.disabled}
                className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center space-x-2 ${
                  option.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : option.className
                      ? option.className
                      : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {IconComponent && (
                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}