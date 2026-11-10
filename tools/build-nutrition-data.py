"""Build the reviewed USDA SR Legacy subset from the official 2018-04 CSV ZIP.
Usage: python3 tools/build-nutrition-data.py /path/to/official.zip
Only source values are copied; missing nutrient observations remain null.
"""
import csv, hashlib, io, json, sys, zipfile
from pathlib import Path
URL='https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip'
# FDC id, translated reference description, preparation, explicit aliases.
SELECTION=[
(170457,'番茄，红熟，生','raw',['番茄','西红柿','tomato','tomatoes']),
(170050,'番茄，红熟，熟','cooked',['番茄','西红柿','tomato','tomatoes']),
(171287,'全鸡蛋，生鲜','raw',['鸡蛋','蛋','egg','eggs']),
(173424,'全鸡蛋，水煮','cooked',['水煮蛋','鸡蛋','egg','eggs','hard-boiled egg']),
(169230,'大蒜，生','raw',['大蒜','蒜','garlic']),
(170379,'西兰花，生','raw',['西兰花','broccoli']),
(170393,'胡萝卜，生','raw',['胡萝卜','carrot','carrots']),
(170000,'洋葱，生','raw',['洋葱','onion','onions','sliced onion','洋葱丝']),
(170026,'土豆，含皮，生','raw',['土豆','马铃薯','potato','potatoes']),
(171077,'鸡胸肉，去皮去骨，生','raw',['鸡胸肉','chicken breast','skinless chicken breast']),
(173627,'鸡腿肉，去皮肉，生','raw',['鸡腿肉','chicken thigh','boneless skinless chicken thigh']),
(171116,'鸡肉末，生','raw',['鸡肉末','ground chicken']),
(172476,'普通豆腐，硫酸钙凝固，生','raw',['豆腐','tofu']),
(168877,'长粒白米，强化，生','raw',['大米','生米','rice','uncooked rice','white rice']),
(168878,'长粒白米，强化，熟','cooked',['米饭','熟米饭','rice','cooked rice','white rice']),
(169736,'意大利面，强化，干','raw',['意面','意大利面','spaghetti','pasta','dry pasta']),
(169737,'意大利面，强化，熟，无盐','cooked',['意面','意大利面','spaghetti','pasta','cooked pasta']),
(171413,'橄榄油','asSold',['橄榄油','olive oil']),
(171411,'大豆油','asSold',['大豆油','soybean oil']),
(171016,'香油／芝麻油','asSold',['香油','芝麻油','sesame oil']),
(173468,'食盐','asSold',['盐','食盐','salt']),
(174277,'酱油，酿造，大豆及小麦','asSold',['酱油','生抽','soy sauce']),
(171265,'全脂牛奶，脂肪 3.25%，添加维生素 D','asSold',['全脂牛奶','whole milk']),
(173414,'切达奶酪','asSold',['切达芝士','切达奶酪','cheddar','cheddar cheese']),
(175238,'罐装黑豆，低钠','asSold',['canned black beans','罐装黑豆']),
(168409,'黄瓜，带皮，生','raw',['黄瓜','长黄瓜','cucumber','english cucumber']),
(170005,'葱，含葱白及葱绿，生','raw',['葱','小葱','spring onion','spring onions','scallion','scallions']),
(170138,'罐装番茄，番茄汁浸，无加盐','asSold',['罐装番茄','canned tomatoes']),
(170459,'罐装番茄膏，无加盐','asSold',['番茄膏','tomato paste']),
(174924,'商业白面包','asSold',['白面包','white bread']),
(169251,'白蘑菇，生','raw',['蘑菇','白蘑菇','mushroom','mushrooms','white mushrooms']),
(168462,'菠菜，生','raw',['菠菜','spinach']),
(167535,'小麦薄饼，耐储存型','asSold',['墨西哥薄饼','tortilla','tortillas']),
(169655,'白砂糖','asSold',['糖','白糖','白砂糖','sugar']),
(169698,'玉米淀粉','asSold',['玉米淀粉','cornstarch','corn starch']),
(170923,'孜然籽','asSold',['孜然籽','cumin seeds']),
(171329,'红椒粉','asSold',['红椒粉','paprika']),
(170151,'全芝麻，烘烤','asSold',['熟芝麻','toasted sesame seeds']),
(170108,'红甜椒，生','raw',['红甜椒','红彩椒','red bell pepper']),
(172232,'罗勒，新鲜','raw',['罗勒','basil','fresh basil']),
(169997,'香菜叶，生','raw',['香菜','cilantro','coriander']),
(170931,'黑胡椒粉','asSold',['黑胡椒','black pepper'])
]
NUTRIENTS={'energy':(1008,'KCAL'),'protein':(1003,'G'),'carbs':(1005,'G'),'fat':(1004,'G'),'fiber':(1079,'G')}

def build(archive):
 raw=Path(archive).read_bytes();z=zipfile.ZipFile(io.BytesIO(raw));prefix=next(n.rsplit('/',1)[0]+'/' for n in z.namelist() if n.endswith('/food.csv'))
 def rows(name):return csv.DictReader(io.TextIOWrapper(z.open(prefix+name),encoding='utf-8-sig'))
 foods={int(row['fdc_id']):row for row in rows('food.csv')};wanted={id for id,*_ in SELECTION};values={id:{} for id in wanted};portions={id:[] for id in wanted}
 nutrients={int(row['id']):row for row in rows('nutrient.csv')}
 for key,(id,unit) in NUTRIENTS.items():assert nutrients[id]['unit_name']==unit,(key,unit)
 for row in rows('food_nutrient.csv'):
  id=int(row['fdc_id']);nutrient=int(row['nutrient_id'])
  if id in wanted and nutrient in {n for n,_ in NUTRIENTS.values()}:
   assert nutrient not in values[id];values[id][nutrient]=float(row['amount']) if row['amount']!='' else None
 for row in rows('food_portion.csv'):
  id=int(row['fdc_id'])
  if id not in wanted or not row['amount'] or not row['gram_weight']:continue
  modifier=row['modifier'];unit='tbsp' if modifier in ['tbsp','tablespoon'] else 'tsp' if modifier=='tsp' else 'piece' if modifier in ['large','medium','small','extra large','jumbo','clove','cloves','tortilla'] else None
  if unit:portions[id].append({'amount':float(row['amount']),'label':modifier,'unit':unit,'grams':float(row['gram_weight'])})
 selected=[]
 for id,zh,state,aliases in SELECTION:
  source=foods[id];selected.append({'fdcId':id,'name':{'zh':zh,'en':source['description']},'state':state,'aliases':aliases,'per100g':{key:values[id].get(n) for key,(n,_) in NUTRIENTS.items()},'portions':portions[id],'publicationDate':source['publication_date']})
 data={'version':1,'source':{'name':'USDA FoodData Central · SR Legacy','release':'2018-04','retrievedOn':'2026-11-09','timeZone':'America/New_York','downloadUrl':URL,'documentationUrl':'https://fdc.nal.usda.gov/download-datasets/','license':'CC0 1.0','sha256':hashlib.sha256(raw).hexdigest()},'nutrientIds':{key:n for key,(n,_) in NUTRIENTS.items()},'foods':selected}
 out=Path(__file__).resolve().parents[1]/'shared/nutrition-data.js';out.write_text('// Generated from the official USDA archive; see tools/build-nutrition-data.py.\nexport const nutritionData='+json.dumps(data,ensure_ascii=False,indent=2)+';\n')
 print(f'{len(selected)} source records written to {out}')
if __name__=='__main__':build(sys.argv[1])
