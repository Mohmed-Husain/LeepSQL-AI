import { useEffect, useState } from 'react';
import {
    MessageSquare,
    Plus,
    Trash2,
    Edit2,
    Check,
    X,
    ChevronLeft,
    ChevronRight,
    History
} from 'lucide-react';
import { useChatHistory } from '../contexts/ChatHistoryContext';
import { ChatSession } from '../services/database/types';

interface ChatHistoryProps {
    databaseName: string;
    onNewChat: () => void;
}

export default function ChatHistory({ databaseName, onNewChat }: ChatHistoryProps) {
    const {
        sessions,
        currentSession,
        selectSession,
        createNewSession,
        renameSession,
        deleteSession,
        isLoading
    } = useChatHistory();

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleNewChat = async () => {
        try {
            await createNewSession(databaseName);
            onNewChat();
        } catch (err) {
            console.error('Failed to create new chat:', err);
        }
    };

    const handleSelectSession = async (session: ChatSession) => {
        if (currentSession?.id === session.id) return;
        await selectSession(session.id);
    };

    const handleStartEdit = (session: ChatSession) => {
        setEditingId(session.id);
        setEditTitle(session.title);
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editTitle.trim()) return;
        try {
            await renameSession(editingId, editTitle.trim());
            setEditingId(null);
            setEditTitle('');
        } catch (err) {
            console.error('Failed to rename session:', err);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditTitle('');
    };

    const handleDeleteClick = (sessionId: string) => {
        setDeleteConfirmId(sessionId);
    };

    const handleConfirmDelete = async () => {

        if (!deleteConfirmId) return;
        try {
            await deleteSession(deleteConfirmId);
            setDeleteConfirmId(null);
        } catch (err) {
            console.error('Failed to delete session:', err);
        }
    };

    const handleCancelDelete = () => {
        setDeleteConfirmId(null);
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    if (isCollapsed) {
        return (
            <div className="w-12 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center py-4">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Expand history"
                >
                    <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <button
                    onClick={handleNewChat}
                    className="mt-4 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="New chat"
                >
                    <Plus className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <div className="mt-4 p-2">
                    <History className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                </div>
            </div>
        );
    }

    useEffect(()=>{
        console.log(sessions);
        
    },[])

    return (
        <div className="w-64 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <span className="font-medium text-slate-900 dark:text-slate-100">Chat History</span>
                </div>
                <button
                    onClick={() => setIsCollapsed(true)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Collapse"
                >
                    <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
            </div>

            {/* New Chat Button */}
            <div className="p-3">
                <button
                    onClick={handleNewChat}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-900 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Chat</span>
                </button>
            </div>
            
            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                        Loading...
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                        No chat history yet
                    </div>
                ) : (
                    <div className="space-y-1 p-2">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className={`group relative rounded-lg transition-colors ${currentSession?.id === session.id
                                        ? 'bg-blue-100 dark:bg-blue-900/40'
                                        : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {editingId === session.id ? (
                                    <div className="p-2 flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="flex-1 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit();
                                                if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                        />
                                        <button
                                            onClick={handleSaveEdit}
                                            className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40 rounded"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : deleteConfirmId === session.id ? (
                                    <div className="p-2 flex flex-col gap-2">
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Delete this chat?</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleConfirmDelete}
                                                className="flex-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                            >
                                                Delete
                                            </button>
                                            <button
                                                onClick={handleCancelDelete}
                                                className="flex-1 px-2 py-1 text-xs bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-300 dark:hover:bg-slate-500"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleSelectSession(session)}
                                        className="w-full p-2 flex items-start gap-2 text-left"
                                    >
                                        <MessageSquare className="w-4 h-4 mt-0.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                                {session.title}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {formatDate(session.updatedAt)}
                                            </p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStartEdit(session);
                                                }}
                                                className="p-1 hover:bg-slate-300 dark:hover:bg-slate-600 rounded"
                                                title="Rename"
                                            >
                                                <Edit2 className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(session.id);
                                                }}
                                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                                            </button>
                                        </div>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
