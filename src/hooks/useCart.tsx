import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCard = [...cart];
      const productExists = cart.find(product => product.id == productId);

      const stock = await api.get(`stock/${productId}`);
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      const stockAmount = stock.data.amount;

      if(amount > stockAmount ) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if(productExists){
        productExists.amount = amount;
      } else {
        const product = await api.get(`products/${productId}`);
        const newProduct = {
          ...product.data,
          amount
        }
        updatedCard.push(newProduct);
      }

      setCart(updatedCard);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCard));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCard = [...cart];

      const productIndexExists = updatedCard.findIndex(product => product.id === productId);

      console.log(productIndexExists)

      if(productIndexExists < 1){
        toast.error("Erro na remoção do produto");
        return;
      }

      updatedCard.splice(productIndexExists, 1);
      
      setCart(updatedCard);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCard));

    } catch {
      toast.error("Erro ao excluir o produto do carrinho!");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      
      if (amount <= 0){
        return;
      }
        
      const stock = await api.get(`stock/${productId}`);
      const stockAmount = stock.data.amount;
      
      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

        const updatedCard = [...cart];
        const productExists = updatedCard.find(product => product.id === productId);
      
        if (productExists){
          productExists.amount = amount;
          setCart(updatedCard);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCard));
        } else {
          throw Error();
        }


    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
