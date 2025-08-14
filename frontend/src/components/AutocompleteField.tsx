import React, { useState, useEffect, useRef } from 'react';
import { Form, ListGroup } from 'react-bootstrap';
import './AutocompleteField.css';

interface AutocompleteFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: any) => void;
  items: any[];
  searchKey: string;
  displayKey: string;
  secondaryKey?: string;
  tertiaryKey?: string;
  required?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'lg';
  className?: string;
  maxResults?: number;
  showId?: boolean;
}

const AutocompleteField: React.FC<AutocompleteFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onSelect,
  items,
  searchKey,
  displayKey,
  secondaryKey,
  tertiaryKey,
  required = false,
  disabled = false,
  size,
  className = '',
  maxResults = 10,
  showId = false
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length > 0) {
      const filtered = items.filter(item => {
        const searchValue = item[searchKey];
        const secondaryValue = secondaryKey ? item[secondaryKey] : null;
        const tertiaryValue = tertiaryKey ? item[tertiaryKey] : null;
        
        // Verificar se os valores existem e são strings antes de chamar toLowerCase
        const searchMatch = searchValue && typeof searchValue === 'string' && 
          searchValue.toLowerCase().includes(value.toLowerCase());
        
        const secondaryMatch = secondaryValue && typeof secondaryValue === 'string' && 
          secondaryValue.toLowerCase().includes(value.toLowerCase());
        
        const tertiaryMatch = tertiaryValue && typeof tertiaryValue === 'string' && 
          tertiaryValue.toLowerCase().includes(value.toLowerCase());
        
        return searchMatch || secondaryMatch || tertiaryMatch;
      });
      setFilteredItems(filtered.slice(0, maxResults));
      setShowDropdown(filtered.length > 0);
    } else {
      setFilteredItems([]);
      setShowDropdown(false);
    }
  }, [value, items, searchKey, secondaryKey, tertiaryKey, maxResults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setSelectedItem(null);
  };

  const handleItemClick = (item: any) => {
    let displayValue = item[displayKey];
    
    if (secondaryKey && item[secondaryKey]) {
      displayValue += ` - ${item[secondaryKey]}`;
    }
    
    if (tertiaryKey && item[tertiaryKey]) {
      displayValue += ` (${item[tertiaryKey]})`;
    }
    
    if (showId && item.id) {
      displayValue = `#${item.id} - ${displayValue}`;
    }
    
    onChange(displayValue);
    onSelect(item);
    setSelectedItem(item);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const formatDisplayValue = (item: any) => {
    let displayValue = item[displayKey];
    
    if (secondaryKey && item[secondaryKey]) {
      displayValue += ` - ${item[secondaryKey]}`;
    }
    
    if (tertiaryKey && item[tertiaryKey]) {
      displayValue += ` (${item[tertiaryKey]})`;
    }
    
    if (showId && item.id) {
      displayValue = `#${item.id} - ${displayValue}`;
    }
    
    return displayValue;
  };

  return (
    <div ref={wrapperRef} className={`autocomplete-wrapper ${className}`}>
      <Form.Group className="mb-3">
        <Form.Label>{label}</Form.Label>
        <Form.Control
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length > 0 && setShowDropdown(true)}
          required={required}
          disabled={disabled}
          size={size}
          autoComplete="off"
          className="autocomplete-input"
        />
      </Form.Group>
      
      {showDropdown && (
        <div className="autocomplete-dropdown">
          <ListGroup className="autocomplete-list">
            {filteredItems.map((item, index) => (
              <ListGroup.Item
                key={index}
                action
                onClick={() => handleItemClick(item)}
                className="autocomplete-item"
              >
                <div className="autocomplete-primary">
                  {formatDisplayValue(item)}
                </div>
                {tertiaryKey && item[tertiaryKey] && (
                  <div className="autocomplete-secondary">{item[tertiaryKey]}</div>
                )}
              </ListGroup.Item>
            ))}
            {filteredItems.length === 0 && value.length > 0 && (
              <ListGroup.Item className="autocomplete-no-results">
                Nenhum resultado encontrado
              </ListGroup.Item>
            )}
          </ListGroup>
        </div>
      )}
    </div>
  );
};

export default AutocompleteField;
