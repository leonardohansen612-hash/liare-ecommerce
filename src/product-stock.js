function productStock(p){
 if(p.available==='OUT_OF_STOCK')return 0;
 return Number.isInteger(p.stockQuantity)&&p.stockQuantity>=0?Math.min(999,p.stockQuantity):999;
}
function productStockLabel(p){
 const stock=productStock(p);
 return stock===0?'Esgotado':Number.isInteger(p.stockQuantity)?stock+' '+(stock===1?'unidade disponível':'unidades disponíveis'):'';
}
function reconcileCartStock(items,products){
 const used=new Map();
 return items.flatMap(item=>{
  const product=products.find(p=>p.name.trim()===item.name);
  if(!product)return [item];
  const limit=productStock(product),remaining=Math.max(0,limit-(used.get(item.name)||0));
  const qty=Math.min(item.qty,remaining);
  used.set(item.name,(used.get(item.name)||0)+qty);
  return qty?[{...item,qty,image:product.image,stockQuantity:limit}]:[];
 });
}
