import numpy as np, matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
def render(meshes, path, views=((25,-60),(25,30),(90,-90)), size=6):
    """meshes: list of (P,T,color)"""
    allp=np.vstack([m[0] for m in meshes]); c=(allp.min(0)+allp.max(0))/2; r=(allp.max(0)-allp.min(0)).max()/2
    fig=plt.figure(figsize=(size*len(views),size))
    for k,(el,az) in enumerate(views):
        ax=fig.add_subplot(1,len(views),k+1,projection='3d'); ax.set_proj_type('ortho')
        for P,T,col in meshes:
            tri=P[T]; n=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]); n/= (np.linalg.norm(n,axis=1)[:,None]+1e-12)
            L=np.array([np.cos(np.radians(el))*np.cos(np.radians(az+40)),np.cos(np.radians(el))*np.sin(np.radians(az+40)),np.sin(np.radians(el))])
            sh=0.35+0.65*np.abs(n@L)
            cols=np.array(matplotlib.colors.to_rgb(col))[None,:]*sh[:,None]
            pc=Poly3DCollection(tri,facecolors=cols,edgecolors='none'); ax.add_collection3d(pc)
        ax.set_xlim(c[0]-r,c[0]+r); ax.set_ylim(c[1]-r,c[1]+r); ax.set_zlim(c[2]-r,c[2]+r)
        ax.view_init(el,az); ax.set_box_aspect((1,1,1)); ax.set_axis_off()
    fig.tight_layout(); fig.savefig(path,dpi=80); plt.close(fig)
