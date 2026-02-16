import type { Config, Data } from "@measured/puck";
import {
  Heading,
  Text,
  Button,
  Container,
  Flex,
  Grid,
  Image,
  Divider,
  Spacer,
  Variable,
  Link,
  List,
  ListItem,
  Card,
  Section,
} from "./components";

export const config: Config = {
  components: {
    Heading,
    Text,
    Button,
    Container,
    Flex,
    Grid,
    Image,
    Divider,
    Spacer,
    Variable,
    Link,
    List,
    ListItem,
    Card,
    Section,
  },
  root: {
    render: ({ children }) => <>{children}</>,
  },
};

export type EmailTemplateData = Data;
export type PageData = Data;
