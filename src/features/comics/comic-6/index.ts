import { metadata } from './content/metadata';
import { navigation } from './content/navigation';
import { identification } from './content/identification';
import { argumentation } from './content/argumentation';
import { resolution } from './content/resolution';
import { application } from './content/application';
import { introspection } from './content/introspection';
import { report } from './content/report';
import { ai } from './content/ai';

const objects = navigation.learningObjects;
const assets = {
  qrCode: navigation.qrCode,
  model3D: navigation.model3D,
};

export const Comic6Module = {
  metadata,
  navigation,
  identification,
  argumentation,
  resolution,
  application,
  introspection,
  report,
  ai,
  assets,
  objects,
};
