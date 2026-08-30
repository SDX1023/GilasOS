'use client';

import { useState } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleType, setModuleType] = useState<'pdf' | 'deck' | 'custom'>('pdf');
  const [draggedModule, setDraggedModule] = useState<string | null>(null);
  const [dragOverModule, setDragOverModule] = useState<string | null>(null);

  // ============================================================
  // MODULES DATA
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
  // DRAG AND DROP
  // ============================================================
  const handleDragStart = (e: React.DragEvent, moduleId: string) => {
    setDraggedModule(moduleId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', moduleId);
  };

  const handleDragEnd = () => {
    setDraggedModule(null);
    setDragOverModule(null);
  };

  const handleDragOver = (e: React.DragEvent, moduleId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedModule !== moduleId) {
      setDragOverModule(moduleId);
    }
  };

  const handleDragLeave = () => {
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

  // ============================================================
  // FILTERING
  // ============================================================
  const sortedModules = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));

  const filteredModules = sortedModules.filter((m) => {
    if (!searchQuery.trim()) return true;
    return m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           m.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const tabs = [
    { id: 'flashcards', label: 'Flashcards' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'history', label: 'History' },
    { id: 'study-log', label: 'Study Log' },
  ];

  const colorOptions = [
    '#00d4ff', '#7c3aed', '#10b981', '#f59e0b',
    '#ec4899', '#ef4444', '#8b5cf6', '#06b6d4',
  ];

  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);

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
      case 'pdf': return <FileText className="w-4 h-4 text-[#f59e0b]" />;
      case 'deck': return <BookOpen className="w-4 h-4 text-[#00d4ff]" />;
      default: return <FolderOpen className="w-4 h-4 text-white/40" />;
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'pdf': return 'PDF';
      case 'deck': return 'Deck';
      default: return 'Module';
    }
  };

  const totalCards = modules.reduce((acc, m) => acc + m.cardCount, 0);
  const totalModules = modules.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in main-content">
      <h1 className="text-3xl font-bold text-white mb-6">Study</h1>

      {/* Tabs */}
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
        {/* Header */}
        <div className="module-header">
          <h2>Flashcard Modules</h2>
          <div className="actions">
            <div className="search-wrapper">
              <Search className="search-icon w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules..."
                className="w-48 pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-[#00d4ff] transition-colors"
              />
            </div>
            <button
              onClick={() => setShowCreateModule(true)}
              className="btn-add"
            >
              <Plus className="w-4 h-4" />
              Module
            </button>
          </div>
        </div>

        {/* Drag Instruction */}
        {modules.length > 1 && (
          <div className="text-xs text-white/30 mb-3 flex items-center gap-2">
            <GripVertical className="w-3 h-3" />
            Drag modules to reorder
          </div>
        )}

        {/* Module List */}
        {filteredModules.length === 0 ? (
          <div className="empty-state">
            <span className="icon">📁</span>
            <h3>{searchQuery ? 'No modules match your search' : 'No modules yet'}</h3>
            <p>{searchQuery ? 'Try a different search term' : 'Create your first module to get started'}</p>
          </div>
        ) : (
          <div className="module-grid">
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
                  className={`module-card ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                  style={{ position: 'relative' }}
                >
                  {isDragOver && <div className="drop-indicator" />}

                  {/* Drag Handle */}
                  <div className="drag-handle">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Color Bar */}
                  <div className="color-bar" style={{ background: module.color || '#00d4ff' }} />

                  {/* Icon */}
                  <div className="icon-wrapper">
                    {getTypeIcon(module.type)}
                  </div>

                  {/* Info */}
                  <div className="info">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="name">{module.name}</span>
                      <span className="type-badge">{getTypeLabel(module.type)}</span>
                    </div>
                    {module.description && (
                      <div className="description">{module.description}</div>
                    )}
                    <div className="stats">
                      <span>{module.cardCount} cards</span>
                      {module.deckCount !== undefined && module.deckCount > 0 && (
                        <>
                          <span>•</span>
                          <span>{module.deckCount} {module.deckCount === 1 ? 'deck' : 'decks'}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="arrow w-4 h-4" />
                </Link>
              );
            })}
          </div>
        )}

        {/* Stats */}
        {modules.length > 0 && (
          <div className="stats-bar">
            <span className="stat-item">📚 {totalModules} modules</span>
            <span className="stat-item">📇 {totalCards} cards</span>
            <span className="stat-item flex items-center gap-1">
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