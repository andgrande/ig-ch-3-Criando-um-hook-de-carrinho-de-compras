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
      const { data } = await api.get(`/stock/${productId}`);

      if (data.amount <= 1) {
        throw new Error();
      }

      const isInCart = cart.find(item => item.id === productId);

      if (isInCart) {
        const inCart = cart.map(item => { 
          if (item.id === productId) {

            if (data.amount <= item.amount) {
              throw new Error();
            }

            return {
              ...item,
              amount: item.amount +1,
            }
          } else {
            return {
              ...item,
            }
          }
        });

        setCart([...inCart]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([
          ...inCart,
        ]));

      } else {
        const { data } = await api.get(`/products/${productId}`);
        const product = [{
          ...data, 
          amount: 1
        }];

        setCart([
          ...cart,
          ...product,
        ]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([
          ...cart,
          ...product,
        ]));
      }

      // const see = await api.patch(`/stock/${productId}`, {
      //   amount: data.amount - 1,
      // });

      // console.log(see);

    } catch (err){
      toast.error('Quantidade solicitada fora de estoque');
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productInCart = cart.find(item => item.id === productId);

      if (!productInCart) {
        throw new Error();
      }

      const removedFromCart = cart.filter(item => item.id !== productId);

      setCart([...removedFromCart]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...removedFromCart]));

    } catch (err) {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data } = await api.get(`/stock/${productId}`);

      if (data.amount < 1 || data.amount < amount || amount < 1) {
        throw new Error();
      }

      const productInCart = cart.find(item => item.id === productId);

      if (!productInCart) {
        throw new Error();
      }

      const updatedCart = cart.map(item => {
        if (item.id === productId) {
          return {
            ...item,
            amount,
          }
        } else {
          return {
            ...item
          }
        };
      });

      setCart([...updatedCart]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...updatedCart]));

    } catch (err) {
      toast.error('Quantidade solicitada fora de estoque');
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
