'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, FileText, BookOpen, FolderOpen, ChevronRight, Search, X, GripVertical } from 'lucide-react';

interface PDFModule {
  id: string;
  name: string;
  description?: string;
  cardCount: number;
  deckCount?: number;
  createdAt: string;
  color?: string;
  type?: 'pdf' | 'deck' | 'custom';
  order?: number;
}

export default function StudyPage() {
  const [activeTab, setActiveTab] = useState('flashcards');
  const [showCreateModule, setShowCreateModule] = useState(false);
  const [moduleName, setModuleName] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // ✅ Ensure this is empty by default
  const [moduleType, setModuleType] = useState<'pdf' | 'deck' | 'custom'>('pdf');
  const [draggedModule, setDraggedModule] = useState<string | null>(null);
  const [dragOverModule, setDragOverModule] = useState<string | null>(null);

  // ============================================================
  // YOUR EXISTING MODULES
  // ============================================================
  const [modules, setModules] = useState<PDFModule[]>([
    {
      id: '1',
      name: 'pdf-generated',
      description: 'Auto-generated from PDF uploads',
      cardCount: 428,
      deckCount: 1,
      createdAt: '2024-01-15',
      color: '#00d4ff',
      type: 'pdf',
      order: 0,
    },
    {
      id: '2',
      name: 'pdf-cards',
      description: 'PDF flashcard decks',
      cardCount: 428,
      deckCount: 5,
      createdAt: '2024-01-20',
      color: '#7c3aed',
      type: 'pdf',
      order: 1,
    },
    {
      id: '3',
      name: 'bang',
      description: 'Bang style flashcards',
      cardCount: 199,
      deckCount: 0,
      createdAt: '2024-02-01',
      color: '#10b981',
      type: 'custom',
      order: 2,
    },
    {
      id: '4',
      name: 'Quiz Bee',
      description: 'Quiz bee preparation',
      cardCount: 90,
      deckCount: 0,
      createdAt: '2024-02-05',
      color: '#f59e0b',
      type: 'custom',
      order: 3,
    },
    {
      id: '5',
      name: 'd',
      description: 'Subject D flashcards',
      cardCount: 31,
      deckCount: 0,
      createdAt: '2024-02-10',
      color: '#ec4899',
      type: 'custom',
      order: 4,
    },
    {
      id: '6',
      name: 'g',
      description: 'Subject G flashcards',
      cardCount: 32,
      deckCount: 0,
      createdAt: '2024-02-12',
      color: '#8b5cf6',
      type: 'custom',
      order: 5,
    },
    {
      id: '7',
      name: 'n',
      description: 'Subject N flashcards',
      cardCount: 76,
      deckCount: 0,
      createdAt: '2024-02-15',
      color: '#ef4444',
      type: 'custom',
      order: 6,
    },
  ]);

  // ============================================================
  // DRAG AND DROP HANDLERS
  // ============================================================
  const handleDragStart = (e: React.DragEvent, moduleId: string) => {
    setDraggedModule(moduleId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', moduleId);
    setTimeout(() => {
      e.currentTarget.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedModule(null);
    setDragOverModule(null);
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent, moduleId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedModule !== moduleId) {
      setDragOverModule(moduleId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setDragOverModule(null);
  };

  const handleDrop = (e: React.DragEvent, targetModuleId: string) => {
    e.preventDefault();
    const sourceModuleId = e.dataTransfer.getData('text/plain');
    
    if (sourceModuleId === targetModuleId) return;

    const sourceIndex = modules.findIndex(m => m.id === sourceModuleId);
    const targetIndex = modules.findIndex(m => m.id === targetModuleId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const newModules = [...modules];
    const [removed] = newModules.splice(sourceIndex, 1);
    newModules.splice(targetIndex, 0, removed);

    const updatedModules = newModules.map((mod, index) => ({
      ...mod,
      order: index,
    }));

    setModules(updatedModules);
    setDraggedModule(null);
    setDragOverModule(null);
  };

  // Sort modules by order
  const sortedModules = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));

  const tabs = [
    { id: 'flashcards', label: 'Flashcards' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'history', label: 'History' },
    { id: 'study-log', label: 'Study Log' },
  ];

  const colorOptions = [
    '#00d4ff', // Cyan
    '#7c3aed', // Purple
    '#10b981', // Green
    '#f59e0b', // Orange
    '#ec4899', // Pink
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#06b6d4', // Teal
  ];

  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);

  // ✅ FIXED: Filter modules properly - show ALL if search is empty
  const filteredModules = sortedModules.filter((m) => {
    if (!searchQuery.trim()) return true; // Show all if search is empty
    return m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           m.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCreateModule = () => {
    if (!moduleName.trim()) return;

    const newModule: PDFModule = {
      id: Date.now().toString(),
      name: moduleName,
      description: moduleDescription || undefined,
      cardCount: 0,
      deckCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      color: selectedColor,
      type: moduleType,
      order: modules.length,
    };

    setModules([...modules, newModule]);
    setShowCreateModule(false);
    setModuleName('');
    setModuleDescription('');
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'deck':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <FolderOpen className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'pdf':
        return 'PDF';
      case 'deck':
        return 'Deck';
      default:
        return 'Module';
    }
  };

  const totalCards = modules.reduce((acc, m) => acc + m.cardCount, 0);
  const totalModules = modules.length;

  // ✅ Debug: log what's being rendered
  console.log('Total modules:', modules.length);
  console.log('Filtered modules:', filteredModules.length);
  console.log('Search query:', searchQuery);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-6">Study</h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#00d4ff] text-white shadow-lg shadow-[#00d4ff]/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Flashcards Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        {/* Header with Search and Add */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <h2 className="text-xl font-semibold text-white flex-1">Flashcard Modules</h2>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules..."
                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-[#00d4ff] transition-colors"
              />
            </div>
            <button
              onClick={() => setShowCreateModule(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#00d4ff] hover:bg-[#00b8d4] rounded-xl text-white font-medium transition-colors text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Module
            </button>
          </div>
        </div>

        {/* Drag & Drop Instructions */}
        {modules.length > 1 && (
          <div className="text-xs text-white/30 mb-3 flex items-center gap-2">
            <GripVertical className="w-3 h-3" />
            Drag modules to reorder
          </div>
        )}

        {/* ✅ FIXED: Show modules or empty state */}
        {filteredModules.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">{searchQuery ? 'No modules match your search' : 'No modules yet'}</p>
            <p className="text-white/20 text-sm">
              {searchQuery ? 'Try a different search term' : 'Create your first module to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredModules.map((module) => {
              const isDragOver = dragOverModule === module.id;
              const isDragging = draggedModule === module.id;

              return (
                <Link
                  key={module.id}
                  href={`/study/module/${module.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, module.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, module.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, module.id)}
                  className={`
                    flex items-center gap-4 p-4 bg-white/5 border rounded-xl 
                    transition-all duration-200 cursor-grab
                    ${isDragOver ? 'border-[#00d4ff] bg-white/10 scale-[1.02] shadow-lg shadow-[#00d4ff]/10' : 'border-white/10'}
                    ${isDragging ? 'opacity-50' : 'hover:bg-white/10'}
                    group relative
                  `}
                >
                  {/* Drag Handle */}
                  <div className="flex-shrink-0 text-white/20 hover:text-white/40 cursor-grab active:cursor-grabbing transition-colors">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Color indicator */}
                  <div
                    className="w-1 h-12 rounded-full flex-shrink-0"
                    style={{ backgroundColor: module.color || '#00d4ff' }}
                  />

                  {/* Icon */}
                  <div className="p-2 rounded-lg bg-white/5 flex-shrink-0">
                    {module.type === 'pdf' ? (
                      <FileText className="w-5 h-5 text-[#f59e0b]" />
                    ) : module.type === 'deck' ? (
                      <BookOpen className="w-5 h-5 text-[#00d4ff]" />
                    ) : (
                      <FolderOpen className="w-5 h-5 text-white/40" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium truncate">{module.name}</p>
                      <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full text-white/40 whitespace-nowrap">
                        {getTypeLabel(module.type)}
                      </span>
                    </div>
                    {module.description && (
                      <p className="text-white/40 text-sm truncate">{module.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/30">
                      <span>{module.cardCount} cards</span>
                      {module.deckCount !== undefined && module.deckCount > 0 && (
                        <>
                          <span>•</span>
                          <span>{module.deckCount} {module.deckCount === 1 ? 'deck' : 'decks'}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0" />

                  {/* Drop indicator overlay */}
                  {isDragOver && (
                    <div className="absolute inset-0 border-2 border-dashed border-[#00d4ff] rounded-xl pointer-events-none" />
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Stats */}
        {modules.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-4 text-sm text-white/40">
            <span>📚 {totalModules} modules</span>
            <span>•</span>
            <span>📇 {totalCards} cards</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <GripVertical className="w-3 h-3" />
              Drag to reorder
            </span>
          </div>
        )}
      </div>

      {/* Create Module Modal */}
      {showCreateModule && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1a1a2e] rounded-2xl border border-white/10 shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Create Flashcard Module</h3>
              <button
                onClick={() => setShowCreateModule(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Module Name */}
              <div>
                <label className="text-sm text-white/60 block mb-1.5">Module Name</label>
                <input
                  type="text"
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  placeholder="e.g., Biology Chapter 1"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#00d4ff] transition-colors"
                  autoFocus
                />
              </div>

              {/* Module Description */}
              <div>
                <label className="text-sm text-white/60 block mb-1.5">Description (optional)</label>
                <input
                  type="text"
                  value={moduleDescription}
                  onChange={(e) => setModuleDescription(e.target.value)}
                  placeholder="What is this module about?"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#00d4ff] transition-colors"
                />
              </div>

              {/* Module Type */}
              <div>
                <label className="text-sm text-white/60 block mb-1.5">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setModuleType('pdf')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      moduleType === 'pdf'
                        ? 'bg-[#f59e0b] text-white'
                        : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    📄 PDF
                  </button>
                  <button
                    onClick={() => setModuleType('deck')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      moduleType === 'deck'
                        ? 'bg-[#00d4ff] text-white'
                        : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    📚 Deck
                  </button>
                  <button
                    onClick={() => setModuleType('custom')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      moduleType === 'custom'
                        ? 'bg-white/20 text-white'
                        : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    📁 Custom
                  </button>
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="text-sm text-white/60 block mb-1.5">Module Color</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        selectedColor === color
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a2e]'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={handleCreateModule}
                  disabled={!moduleName.trim()}
                  className="flex-1 py-2.5 bg-[#00d4ff] hover:bg-[#00b8d4] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors"
                >
                  Create Module
                </button>
                <button
                  onClick={() => setShowCreateModule(false)}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}