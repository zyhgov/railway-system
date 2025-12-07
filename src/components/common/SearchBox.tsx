import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

interface SearchBoxProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  suggestions?: string[];
  onSuggestionClick?: (value: string) => void;
  loading?: boolean;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder = '搜索...',
  onSearch,
  suggestions = [],
  onSuggestionClick,
  loading = false,
}) => {
  const [value, setValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setShowSuggestions(true);
    onSearch(newValue);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue(suggestion);
    setShowSuggestions(false);
    onSuggestionClick?.(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      setShowSuggestions(false);
      onSuggestionClick?.(value);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="
            w-full h-14 pl-12 pr-12
            bg-white rounded-2xl
            border border-gray-200
            text-apple-dark text-lg
            placeholder:text-gray-400
            focus:border-apple-blue focus:ring-4 focus:ring-apple-blue/10
            transition-all duration-200
            shadow-sm hover:shadow-md
          "
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        )}
      </div>

      {/* 搜索建议 */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="
          absolute top-full left-0 right-0 mt-2
          bg-white rounded-2xl shadow-xl
          border border-gray-100
          overflow-hidden z-50
          animate-fade-in
        ">
          {loading ? (
            <div className="p-4 text-center text-gray-500">加载中...</div>
          ) : (
            <ul>
              {suggestions.map((suggestion, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="
                      w-full px-4 py-3 text-left
                      hover:bg-apple-gray
                      text-apple-dark
                      transition-colors
                      flex items-center space-x-3
                    "
                  >
                    <FiSearch className="text-gray-400" />
                    <span>{suggestion}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBox;