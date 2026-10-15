from pathlib import Path
import subprocess,zipfile,re
p=Path(__file__).parent
for f in list((p/'js').glob('*.js'))+list((p/'api').glob('*.js')):
 r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
 assert r.returncode==0,(f,r.stderr)
print('PASS: JS syntax',len(list((p/'js').glob('*.js'))+list((p/'api').glob('*.js'))),'files')
for f in ['js/main.js','js/dashboard.js']:
 s=(p/f).read_text();assert 'marketplace.php' not in s and 'auth.php' not in s
print('PASS: no legacy PHP calls in active customer JS')
s=(p/'api/marketplace.js').read_text()
for marker in ['TURNSTILE_SECRET_KEY','customer_user_id','required_deposit','installment_amount','payment_status:\'pending\'']:
 assert marker in s,marker
print('PASS: guest order guards, server price and auth path present')
assert (p/'03_optional_original_products.sql').exists()
print('PASS: optional original phone catalogue SQL exists')
