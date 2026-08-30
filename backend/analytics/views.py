from rest_framework.decorators import api_view
from rest_framework.response import Response
from config.supabase_client import supabase
from datetime import datetime
from dateutil.relativedelta import relativedelta

@api_view(['GET'])
def sales_by_driver_monthly(request):
    driver_ids = request.query_params.getlist('driver_ids')
    start_month = request.query_params.get('start_month')
    end_month = request.query_params.get('end_month')

    try:
        # Buscar pedidos com status ENTREGUE
        query = supabase.table('orders').select('*, order_items(*), delivery_drivers(name)')
        query = query.eq('status', 'ENTREGUE')
        
        # Filtrar por entregadores
        if driver_ids and len(driver_ids) > 0:
            query = query.in_('delivery_driver_id', driver_ids)
        
        # Filtrar por período
        if start_month:
            start_date = datetime.strptime(start_month, '%Y-%m')
            query = query.gte('created_at', start_date.isoformat())
        if end_month:
            end_date = datetime.strptime(end_month, '%Y-%m') + relativedelta(months=1)
            query = query.lt('created_at', end_date.isoformat())
        
        result = query.execute()
        orders = result.data
        
        # Agrupar por entregador e mês
        driver_monthly = {}
        for order in orders:
            driver_id = order.get('delivery_driver_id')
            driver_name = 'Sem entregador'
            if driver_id and order.get('delivery_drivers'):
                driver_name = order['delivery_drivers'].get('name', 'Sem entregador')
            elif not driver_id:
                driver_id = 'none'
            
            # Extrair mês da data
            created_at = order.get('created_at')
            if created_at:
                month = created_at[:7]  # YYYY-MM
            else:
                continue
            
            key = f"{driver_id}_{month}"
            if key not in driver_monthly:
                driver_monthly[key] = {
                    'driver_id': driver_id,
                    'driver_name': driver_name,
                    'month': month,
                    'total_sales': 0,
                    'order_count': 0,
                    'order_ids': []
                }
            
            # Calcular total do pedido
            order_total = 0
            for item in order.get('order_items', []):
                order_total += item.get('quantity', 0) * item.get('unit_price', 0)
            
            driver_monthly[key]['total_sales'] += order_total
            driver_monthly[key]['order_count'] += 1
            driver_monthly[key]['order_ids'].append(order.get('id'))
        
        # Calcular preço médio e preparar resultados
        results = []
        for key, data in driver_monthly.items():
            avg_price = data['total_sales'] / data['order_count'] if data['order_count'] > 0 else 0
            results.append({
                'driver_id': data['driver_id'],
                'driver_name': data['driver_name'],
                'month': data['month'],
                'order_count': data['order_count'],
                'total_sales': round(data['total_sales'], 2),
                'avg_order_value': round(avg_price, 2)
            })
        
        # Ordenar por entregador e mês
        results.sort(key=lambda x: (x['driver_name'], x['month']))
        
        return Response(results)
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)