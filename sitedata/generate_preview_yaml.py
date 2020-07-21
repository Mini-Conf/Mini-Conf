## sorta lazy

import pandas as pd
import re

for ftype in ['papers', 'workshops', 'dss']:
    if ftype == 'papers':
        continue
    print(f'{ftype}:')
    if ftype == 'papers':
        doclink_prefix = 'poster'
    elif ftype == 'workshops':
        doclink_prefix = 'workshop'
    elif ftype == 'dss':
        doclink_prefix = 'ds'
    df = pd.read_csv(ftype + '.csv')
    for _, row in df.iterrows():
        print('  - time:')
        print('    day: ')
        formatted_title = re.sub('"', '\'', row['title'])
        print(f'    title : "{formatted_title}"')
        print(f'    doclink: /{doclink_prefix}_{row["UID"]}.html')
        print(f'    slideslive_id: {row["slideslive_id"]}')
