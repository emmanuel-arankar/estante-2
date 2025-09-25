import { motion } from 'framer-motion';
import { Star, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const featuredBooks = [
  {
    id: '001',
    title: 'O avesso da pele',
    author: 'Jeferson Tenório',
    year: '2020',
    publisher: 'Companhia das Letras',
    rating: 4.8,
    category: 'Literatura brasileira',
    cover: 'https://m.media-amazon.com/images/I/81p29WCHFaL._SL1500_.jpg'
  },
  {
    id: '002',
    title: 'A revolução dos bichos',
    author: 'George Orwell',
    year: '1945',
    publisher: 'Companhia das Letras',
    rating: 4,
    category: 'Clássico',
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1599145132i/22916766.jpg'
  },
  {
    id: '003',
    title: 'Quarto de despejo',
    author: 'Carolina Maria de Jesus',
    year: '1960',
    publisher: 'Ática',
    rating: 4.4,
    category: 'Biografia',
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1460664994i/29917182.jpg'
  },
  {
    id: '004',
    title: 'Pequeno manual antirracista',
    author: 'Djamila Ribeiro',
    year: '2019',
    publisher: 'Companhia das Letras',
    rating: 4.5,
    category: 'Ensaio',
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1571799051i/48560168.jpg'
  },
];

export const FeaturedBooks = () => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Livros em Destaque
          </h2>
          <p className="text-gray-600">
            Os livros mais populares entre nossa comunidade
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {featuredBooks.map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-full h-60 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <h3 className="text-white font-semibold text-lg">{book.title}</h3>
                          <p className="text-gray-200 text-sm">{book.author}</p>
                        </div>
                        <div className="flex items-center bg-white/90 text-gray-900 px-2 py-1 rounded">
                          <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                          <span className="text-sm font-medium">{Number(book.rating).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>{book.year}</span>
                      <span>{book.publisher}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded">{book.category}</span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-between items-center border-t border-gray-200 pt-6">
          <div className="flex space-x-2">
            {['Literatura', 'Biografia', 'Ensaio', 'Clássicos', 'Todos'].map((category) => (
              <button 
                key={category}
                className="px-4 py-2 text-sm rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
              >
                {category}
              </button>
            ))}
          </div>
          <button className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            Ver todos os livros
            <ChevronRight className="h-5 w-5 ml-1" />
          </button>
        </div>
      </div>
    </section>
  );
};