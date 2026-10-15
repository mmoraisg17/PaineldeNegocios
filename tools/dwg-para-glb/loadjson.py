import json,re
def load(path):
    t=open(path,errors='replace').read()
    t=re.sub(r'-?\bnan\b','null',t); t=re.sub(r'-?\binf\b','null',t)
    return json.loads(t,strict=False)
