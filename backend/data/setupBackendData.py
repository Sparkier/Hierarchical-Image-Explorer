import os
import sys

script_path = os.path.dirname(__file__)

sys.path.insert(1,os.path.join(script_path,"mnist"))

import createMnistAnnotations
import downloadAndUnpackMnistJPG

downloadAndUnpackMnistJPG.main()
createMnistAnnotations.main()
