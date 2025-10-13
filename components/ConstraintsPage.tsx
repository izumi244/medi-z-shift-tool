'use client';

import React, { useState } from 'react';

import { 
  Bot,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

// 型定義 - 新要件に合わせて簡略化
interface BasicConstraint {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ConstraintsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConstraint, setEditingConstraint] = useState<BasicConstraint | null>(null);
  const [searchText, setSearchText] = useState('');

  // フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // 基本的な制約条件（固定）
  const [constraints, setConstraints] = useState<BasicConstraint[]>([
    {
      id: '1',
      name: '労働基準法遵守',
      description: '連続勤務日数は6日以下とし、週40時間を超えないよう調整する',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: '希望休優先',
      description: '希望休の申請を最優先とし、その他の制約は二次的に考慮する',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '3',
      name: '土曜日制約',
      description: '桐山は土曜日勤務不可。その他のスタッフは土曜勤務可能',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '4',
      name: '富沢の短時間勤務制約',
      description: '富沢の短時間勤務（▲午前 or ◆午後）は同日どちらか一方のみ選択可能',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '5',
      name: '月間労働時間制約',
      description: '各スタッフの月間労働時間上限を遵守（富沢・桐山:100h、田中:117h）',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]);

  // フィルタリングされた制約
  const filteredConstraints = constraints.filter(constraint => {
    const matchesSearch = constraint.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         constraint.description.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch && constraint.is_active;
  }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  // モーダルを開く
  const openModal = (constraint?: BasicConstraint) => {
    if (constraint) {
      setEditingConstraint(constraint);
      setFormData({
        name: constraint.name,
        description: constraint.description
      });
    } else {
      setEditingConstraint(null);
      setFormData({
        name: '',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingConstraint(null);
  };

  // 制約を保存
  const saveConstraint = () => {
    const now = new Date().toISOString();
    
    if (editingConstraint) {
      // 編集
      setConstraints(prev => prev.map(constraint => 
        constraint.id === editingConstraint.id
          ? { ...constraint, ...formData, updated_at: now }
          : constraint
      ));
    } else {
      // 新規追加
      const newConstraint: BasicConstraint = {
        id: (constraints.length + 1).toString(),
        ...formData,
        is_active: true,
        created_at: now,
        updated_at: now
      };
      setConstraints(prev => [...prev, newConstraint]);
    }
    
    closeModal();
  };

  // 制約を削除
  const deleteConstraint = (id: string) => {
    if (confirm('この制約条件を削除しますか？')) {
      setConstraints(prev => prev.map(constraint => 
        constraint.id === id ? { ...constraint, is_active: false } : constraint
      ));
    }
  };

  // 制約の重要度アイコン
  const getConstraintIcon = (name: string) => {
    if (name.includes('労働基準法') || name.includes('法')) {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    } else if (name.includes('希望休')) {
      return <Calendar className="w-5 h-5 text-blue-500" />;
    } else if (name.includes('時間')) {
      return <Clock className="w-5 h-5 text-orange-500" />;
    }
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="border-b-2 border-gray-100 pb-6">
        <h2 className="text-3xl font-bold text-indigo-600 mb-2 flex items-center gap-3">
          <Bot className="w-8 h-8" />
          基本制約条件管理
        </h2>
        <p className="text-lg text-gray-600">
          シフト作成時の基本ルール・制約条件を管理
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900">
                {constraints.filter(c => c.is_active).length}
              </div>
              <div className="text-sm text-blue-600">有効な制約条件</div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-900">
                {constraints.filter(c => c.name.includes('労働基準法') || c.name.includes('法')).length}
              </div>
              <div className="text-sm text-orange-600">法的制約</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-900">
                {constraints.filter(c => c.name.includes('時間') || c.name.includes('勤務')).length}
              </div>
              <div className="text-sm text-green-600">勤務制約</div>
            </div>
          </div>
        </div>
      </div>

      {/* 検索・追加ボタン */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="制約条件で検索..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors w-full text-gray-800"
            />
          </div>
        </div>

        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          カスタム制約追加
        </button>
      </div>

      {/* 制約一覧 */}
      <div className="space-y-4">
        {filteredConstraints.map((constraint) => {
          return (
            <div
              key={constraint.id}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getConstraintIcon(constraint.name)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {constraint.name}
                    </h3>
                    <p className="text-gray-700 leading-relaxed mb-3">
                      {constraint.description}
                    </p>
                    <div className="text-sm text-gray-500">
                      更新日: {new Date(constraint.updated_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => openModal(constraint)}
                    className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                    title="編集"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteConstraint(constraint.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="削除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredConstraints.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">制約条件が見つかりません</div>
            <p className="text-gray-500">検索条件を変更するか、新しい制約条件を追加してください</p>
          </div>
        )}
      </div>

      {/* 制約追加・編集モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-indigo-600">
                {editingConstraint ? '制約条件編集' : 'カスタム制約条件追加'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form className="space-y-6">
              <div>
                <label htmlFor="constraint-name" className="block text-sm font-semibold text-gray-700 mb-2">
                  制約名 <span className="text-red-500">*</span>
                </label>
                <input
                  id="constraint-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-800"
                  placeholder="例：週末勤務制限"
                />
              </div>

              <div>
                <label htmlFor="constraint-description" className="block text-sm font-semibold text-gray-700 mb-2">
                  制約内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="constraint-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-800 resize-none"
                  rows={4}
                  placeholder="例：土日連続勤務は避け、最低どちらか一日は休みとする"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">💡 制約設定のヒント</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 具体的で分かりやすい制約内容を記載してください</li>
                  <li>• 法的制約は「労働基準法」等のキーワードを含めてください</li>
                  <li>• 時間制約は具体的な時間数を明記してください</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={saveConstraint}
                  disabled={!formData.name.trim() || !formData.description.trim()}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all duration-300"
                >
                  {editingConstraint ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConstraintsPage;