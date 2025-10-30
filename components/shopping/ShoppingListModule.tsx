
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Module from '../common/Module';
import { ShoppingItem, ShoppingCategory } from '../../types';
import { ShoppingCartIcon, PlusCircleIcon, PencilIcon, ChevronDownIcon, TrashIcon } from '../common/Icons';

const LOCAL_STORAGE_KEY = 'lifesyncd_shopping_list';

// --- Helper for Auto-Categorization ---
const autoCategorize = (itemName: string): ShoppingCategory => {
  const lowerCaseName = itemName.toLowerCase();

  // Keyword mappings for categories
  const categoryKeywords: { [key in ShoppingCategory]?: string[] } = {
    Produce: ['apple', 'banana', 'orange', 'lettuce', 'broccoli', 'carrot', 'potato', 'onion', 'tomato', 'berry', 'fruit', 'vegetable', 'spinach', 'kale', 'avocado', 'grape'],
    Dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'eggs', 'sour cream', 'cottage cheese'],
    Meat: ['chicken', 'beef', 'pork', 'fish', 'turkey', 'sausage', 'bacon', 'ham', 'salmon', 'tuna'],
    Pantry: ['pasta', 'rice', 'bread', 'flour', 'sugar', 'salt', 'cereal', 'coffee', 'tea', 'oil', 'spices', 'canned', 'soup', 'beans', 'oats', 'honey', 'jam', 'peanut butter', 'nuts', 'crackers', 'chips'],
    Frozen: ['ice cream', 'pizza', 'fries', 'frozen vegetables', 'frozen fruit', 'waffles', 'nuggets'],
    Beverages: ['water', 'juice', 'soda', 'beer', 'wine', 'cola', 'tea', 'coffee'],
    'Personal Care': ['shampoo', 'soap', 'toothpaste', 'brush', 'lotion', 'deodorant', 'razor', 'conditioner', 'body wash'],
    Household: ['cleaner', 'detergent', 'paper towels', 'toilet paper', 'trash bags', 'dish soap', 'sponge', 'light bulb', 'batteries'],
  };

  for (const category in categoryKeywords) {
    if (Object.prototype.hasOwnProperty.call(categoryKeywords, category)) {
      const keywords = categoryKeywords[category as ShoppingCategory];
      if (keywords?.some(keyword => lowerCaseName.includes(keyword))) {
        return category as ShoppingCategory;
      }
    }
  }

  return 'Other'; // Default category if no match
};

// --- Sub-component: ShoppingItemForm ---
interface ShoppingItemFormProps {
  initialItem: ShoppingItem | null;
  onSubmit: (item: ShoppingItem) => void;
  onCancel: () => void;
}

const ShoppingItemForm: React.FC<ShoppingItemFormProps> = ({ initialItem, onSubmit, onCancel }) => {
  const [name, setName] = useState(initialItem?.name || '');
  const [category, setCategory] = useState<ShoppingCategory>(initialItem?.category || 'Other');
  const [validationError, setValidationError] = useState('');

  // Effect to auto-categorize when name changes
  useEffect(() => {
    if (name.trim() && !initialItem) { // Only auto-categorize for new items, not when editing (unless explicitly changed)
      const suggestedCategory = autoCategorize(name);
      setCategory(suggestedCategory);
    } else if (initialItem && name.trim() && name !== initialItem.name) { // If editing and name changed
        const suggestedCategory = autoCategorize(name);
        setCategory(suggestedCategory);
    }
  }, [name, initialItem]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError('Item name is required.');
      return;
    }

    const newOrUpdatedItem: ShoppingItem = {
      id: initialItem?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More robust ID generation
      name: name.trim(),
      completed: initialItem?.completed || false,
      category: category,
    };
    onSubmit(newOrUpdatedItem);
  }, [name, category, initialItem, onSubmit]);

  const allCategories: ShoppingCategory[] = [
    'Produce', 'Dairy', 'Meat', 'Pantry', 'Frozen', 'Beverages',
    'Personal Care', 'Household', 'Other'
  ];

  return (
    <Module title={initialItem ? 'Edit Shopping Item' : 'Add New Shopping Item'} icon={<ShoppingCartIcon />}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="itemName" className="block text-gray-300 text-sm font-bold mb-2">
            Item Name:
          </label>
          <input
            type="text"
            id="itemName"
            value={name}
            onChange={(e) => { setName(e.target.value); setValidationError(''); }}
            className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400 text-base"
            placeholder="e.g., Milk"
            required
            aria-required="true"
          />
          {validationError && (
            <p className="text-red-400 text-sm mt-1">{validationError}</p>
          )}
        </div>
        <div>
          <label htmlFor="itemCategory" className="block text-gray-300 text-sm font-bold mb-2">
            Category:
          </label>
          <select
            id="itemCategory"
            value={category}
            onChange={(e) => setCategory(e.target.value as ShoppingCategory)}
            className="w-full p-3 rounded-lg bg-slate-700/70 border border-slate-600 focus:ring-purple-500 focus:border-purple-500 text-gray-100 text-base"
          >
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-700/50">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {initialItem ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </form>
    </Module>
  );
};

// --- Main ShoppingListModule Component ---
const ShoppingListModule: React.FC = () => {
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<ShoppingCategory>>(new Set());

  // Load items from local storage on initial mount
  useEffect(() => {
    const storedList = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedList) {
      setShoppingList(JSON.parse(storedList));
      // Expand all categories by default on load
      const items = JSON.parse(storedList) as ShoppingItem[];
      const categories = new Set(items.map(item => item.category));
      setExpandedCategories(categories);
    }
  }, []);

  // Save items to local storage whenever they change
  useEffect(() => {
    // console.log('Saving shopping list to local storage:', shoppingList); // Debugging
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(shoppingList));
  }, [shoppingList]);

  const handleCreateNewItem = useCallback(() => {
    setEditingItem(null);
    setShowForm(true);
  }, []);

  const handleEditItem = useCallback((item: ShoppingItem) => {
    setEditingItem(item);
    setShowForm(true);
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this shopping item?')) {
      console.log('ShoppingListModule: Attempting to delete item with ID:', id);
      setShoppingList((prevList) => {
        console.log('ShoppingListModule: Previous list:', prevList);
        const newList = prevList.filter((item) => String(item.id) !== String(id));
        console.log('ShoppingListModule: New list after filter (should not contain deleted item):', newList);
        console.log('ShoppingListModule: Calling setShoppingList with new list of length:', newList.length);
        return newList;
      });
    } else {
      console.log('ShoppingListModule: Deletion cancelled.');
    }
  }, []);

  const handleSaveItem = useCallback((newOrUpdatedItem: ShoppingItem) => {
    if (editingItem) {
      setShoppingList((prevList) =>
        prevList.map((item) =>
          item.id === newOrUpdatedItem.id ? newOrUpdatedItem : item
        )
      );
    } else {
      setShoppingList((prevList) => [...prevList, newOrUpdatedItem]);
    }
    setShowForm(false);
    setEditingItem(null);
    // Ensure the category of the new item is expanded
    setExpandedCategories(prev => new Set(prev).add(newOrUpdatedItem.category));
  }, [editingItem]);

  const toggleItemCompletion = useCallback((id: string) => {
    setShoppingList((prevList) =>
      prevList.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);

  const toggleCategoryExpansion = useCallback((category: ShoppingCategory) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  // Group items by category and sort categories (e.g., alphabetically or by a custom order)
  const groupedItems = useMemo(() => {
    const groups: { [key in ShoppingCategory]?: ShoppingItem[] } = {};
    const sortedList = [...shoppingList].sort((a, b) => a.name.localeCompare(b.name));

    sortedList.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category]?.push(item);
    });

    // Custom order for categories, with 'Other' usually last
    const categoryOrder: ShoppingCategory[] = [
      'Produce', 'Dairy', 'Meat', 'Pantry', 'Frozen', 'Beverages',
      'Personal Care', 'Household', 'Other'
    ];

    return categoryOrder
      .filter(cat => groups[cat] && groups[cat]?.length > 0) // Only include categories that have items
      .map(cat => ({
        category: cat,
        items: groups[cat] || []
      }));
  }, [shoppingList]);


  if (showForm) {
    return (
      <ShoppingItemForm
        initialItem={editingItem}
        onSubmit={handleSaveItem}
        onCancel={() => {
          setShowForm(false);
          setEditingItem(null);
        }}
      />
    );
  }

  return (
    <Module title="Shopping List" icon={<ShoppingCartIcon />}>
      {shoppingList.length === 0 ? (
        <p className="text-gray-400 text-center py-4">Your shopping list is empty. What do you need?</p>
      ) : (
        <div className="space-y-4">
          {groupedItems.map(({ category, items }) => (
            <div key={category} className="bg-slate-700/40 backdrop-blur-md border border-slate-600/60 rounded-xl shadow-lg overflow-hidden">
              <button
                onClick={() => toggleCategoryExpansion(category)}
                className="w-full flex items-center justify-between p-4 text-left font-bold text-lg text-white hover:bg-slate-600/50 transition-colors duration-200"
                aria-expanded={expandedCategories.has(category)}
                aria-controls={`shopping-list-${category}`}
              >
                <span>{category}</span>
                <ChevronDownIcon className={`h-6 w-6 transition-transform duration-200 ${expandedCategories.has(category) ? 'rotate-180' : ''}`} />
              </button>
              {expandedCategories.has(category) && (
                <ul id={`shopping-list-${category}`} className="p-3 border-t border-slate-600">
                  {items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center group bg-slate-800/40 backdrop-blur-md border border-slate-700/60 rounded-lg p-3 my-2 transform transition-all duration-300 hover:scale-[1.01] hover:bg-slate-700/50"
                      >
                        <div
                          onClick={() => toggleItemCompletion(item.id)}
                          className={`w-5 h-5 mr-3 rounded-sm border-2 flex-shrink-0 cursor-pointer flex items-center justify-center ${
                            item.completed ? 'bg-blue-500 border-blue-500' : 'border-gray-500 group-hover:border-blue-500'
                          }`}
                          aria-label={`Mark ${item.name} as ${item.completed ? 'not completed' : 'completed'}`}
                        >
                          {item.completed && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className={`flex-1 ${item.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                          {item.name}
                        </span>
                        <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="text-gray-400 hover:text-blue-400 transition-colors duration-200 p-1 rounded-full hover:bg-slate-600"
                            aria-label={`Edit ${item.name}`}
                          >
                            <PencilIcon />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors duration-200 p-1 rounded-full hover:bg-slate-600"
                            aria-label={`Delete ${item.name}`}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <button
          onClick={handleCreateNewItem}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center text-lg"
          aria-label="Add new shopping item"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" /> Add New Item
        </button>
      </div>
    </Module>
  );
};

export default ShoppingListModule;
