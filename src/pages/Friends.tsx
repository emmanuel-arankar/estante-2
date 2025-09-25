import React, { useState } from 'react';
import { DenormalizedFriendsList } from '../components/friends/DenormalizedFriendsList';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { List, Grid } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Página de amigos com sistema avançado
 * ✅ Suporte a milhares de amigos
 * ✅ Virtualização para performance
 * ✅ Paginação infinita
 * ✅ Cache inteligente
 * ✅ Busca fuzzy em tempo real
 */

export const Friends = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header com seletor de visualização */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Amigos</h1>
              <p className="text-gray-600">
                Gerencie suas conexões com performance otimizada
              </p>
            </div>
            
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={(value) => {
                if (value) setViewMode(value as 'grid' | 'list');
              }}
              className="bg-gray-100 rounded-md p-1"
            >
              <ToggleGroupItem 
                value="grid" 
                aria-label="Visualização em grade"
                className="data-[state=on]:bg-white data-[state=on]:shadow-sm data-[state=on]:text-emerald-600 px-3"
              >
                <Grid className="h-4 w-4 mr-2" />
                Grade
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="list" 
                aria-label="Visualização em lista"
                className="data-[state=on]:bg-white data-[state=on]:shadow-sm data-[state=on]:text-emerald-600 px-3"
              >
                <List className="h-4 w-4 mr-2" />
                Lista
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <DenormalizedFriendsList viewMode={viewMode} />
        </motion.div>
      </div>
    </div>
  );
};
