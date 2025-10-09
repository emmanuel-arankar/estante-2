import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  MessageCircle, 
  BookOpen, 
  Menu, 
  X, 
  LogOut, 
  Settings, 
  UserCircle, 
  Users 
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Avatar, 
  AvatarFallback,
  AvatarImage 
} from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { logout } from '@/services/auth';
import { useImageLoad } from '@/hooks/useImageLoad';
import { subscribeToFriendRequests } from '@/services/firestore';
import { PATHS } from '@/router/paths';
import { User } from '@/models';
import { PrefetchLink } from '@/components/ui/prefetch-link';
import { userQuery } from '@/features/users/user.queries';

interface HeaderProps {
  userProfile: User | null;
  initialFriendRequests: number;
}

export const Header = ({ userProfile, initialFriendRequests }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [friendRequestsCount, setFriendRequestsCount] = useState(initialFriendRequests);
  
  const { isLoaded: isAvatarLoaded } = useImageLoad(userProfile?.photoURL);

  useEffect(() => {
    if (!userProfile?.id) { // # atualizado
        setFriendRequestsCount(0);
        return;
    };
    
    const unsubscribe = subscribeToFriendRequests(userProfile.id, (requests) => { // # atualizado
      setFriendRequestsCount(requests.length);
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userProfile?.id]); // # atualizado
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate(PATHS.HOME);
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to={PATHS.HOME} className="flex items-center space-x-3">
            <div className="bg-emerald-600 p-2.5 rounded-xl shadow-lg"> 
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-xl font-bold text-emerald-700 font-sans">Estante de Bolso</span>
              <p className="text-xs text-gray-500 hidden sm:block font-sans">Toda literatura na palma da sua mão</p>
            </div>
          </Link>

          {userProfile ? ( // # atualizado
            <>
              <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input type="text" placeholder="Buscar livros, autores, editoras ou usuários..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 w-full bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-500 rounded-full font-sans"/>
                </div>
              </form>

              <div className="hidden md:flex items-center space-x-4">
                <Button variant="ghost" size="icon" asChild className="relative rounded-full">
                  <Link to={PATHS.NOTIFICATIONS}><Bell className="h-5 w-5" /></Link>
                </Button>
                <Button variant="ghost" size="icon" asChild className="relative rounded-full">
                  <Link to={PATHS.MESSAGES}><MessageCircle className="h-5 w-5" /></Link>
                </Button>
                <Button variant="ghost" size="icon" asChild className="relative rounded-full">
                  <Link to={PATHS.FRIENDS}>
                    <Users className="h-5 w-5" />
                    {friendRequestsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {friendRequestsCount > 99 ? '+99' : friendRequestsCount}
                      </span>
                    )}
                  </Link>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      {isAvatarLoaded ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={userProfile?.photoURL} alt={userProfile?.displayName} />
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 font-sans">
                            {userProfile?.displayName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <LoadingSpinner size="sm" />
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center space-x-2 p-2">
                        <Avatar className="h-8 w-8"><AvatarImage src={userProfile?.photoURL} alt={userProfile?.displayName} /><AvatarFallback className="bg-emerald-100 text-emerald-700 font-sans">{userProfile?.displayName?.charAt(0) || 'U'}</AvatarFallback></Avatar>
                        <div className="flex flex-col space-y-1"><p className="text-sm font-medium leading-none">{userProfile?.displayName}</p><p className="text-xs leading-none text-muted-foreground">@{userProfile?.nickname}</p></div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><PrefetchLink to={PATHS.PROFILE_ME} query={userQuery(userProfile.id)} className="cursor-pointer" ><UserCircle className="mr-2 h-4 w-4" /><span>Meu Perfil</span></PrefetchLink></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to={PATHS.PROFILE_EDIT} className="cursor-pointer"><Settings className="mr-2 h-4 w-4" /><span>Configurações</span></Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="cursor-pointer text-red-600 focus:text-red-600"><LogOut className="mr-2 h-4 w-4" /><span>{isLoggingOut ? 'Saindo...' : 'Sair'}</span></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" asChild className="text-gray-600 hover:text-emerald-600 rounded-full font-sans"><Link to={PATHS.LOGIN}>Entrar</Link></Button>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 font-sans"><Link to={PATHS.REGISTER}>Cadastrar</Link></Button>
            </div>
          )}

          <Button variant="ghost" size="icon" className="md:hidden rounded-full" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
};